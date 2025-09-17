// @ts-nocheck

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  userType: 'sales_agent' | 'developer';
  otpCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userType, otpCode }: VerifyOTPRequest = await req.json();

    console.log(`OTP verification request for ${email} (${userType})`);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Use the database function to validate OTP
    const { data, error } = await supabase
      .rpc('validate_password_reset_otp', {
        p_email: email.toLowerCase(),
        p_otp_code: otpCode,
        p_user_type: userType
      });

    if (error) {
      console.error('OTP validation error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to verify OTP. Please try again." 
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

    console.log('OTP verified successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        userId: result.user_id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in forgot-password-verify-otp function:", error);
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