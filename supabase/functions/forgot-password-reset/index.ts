// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import bcrypt from "npm:bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  userType: 'sales_agent' | 'developer';
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userType, newPassword }: ResetPasswordRequest = await req.json();

    console.log(`Password reset request for ${email} (${userType})`);

    // Validate password strength
    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Password must be at least 8 characters long" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    const complexityScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (complexityScore < 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Hash the new password securely (bcryptjs compatible with Edge runtime)
    const saltRounds = 12;
    const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

    // Use the database function to reset password
    const { data, error } = await supabase
      .rpc('reset_user_password', {
        p_email: email.toLowerCase(),
        p_user_type: userType,
        p_new_password_hash: hashedPassword
      });

    if (error) {
      console.error('Password reset error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to reset password. Please try again." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid response from server" 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = data[0];

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Password reset successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in forgot-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error. Please try again." 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);