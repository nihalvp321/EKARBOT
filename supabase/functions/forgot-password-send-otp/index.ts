// @ts-nocheck

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  userType: 'sales_agent' | 'developer';
  agentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userType, agentId }: SendOTPRequest = await req.json();

    console.log(`Password reset OTP request for ${email} (${userType})`);

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user exists in app_users table
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('id, email, username')
      .eq('email', email.toLowerCase())
      .eq('user_type', userType)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.log('User not found:', email, userType);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No account found with this email address" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify agent ID matches (for sales_agent userType, check against sales_agents table)
    if (userType === 'sales_agent') {
      const { data: agentData, error: agentError } = await supabase
        .from('sales_agents')
        .select('sales_agent_id')
        .eq('email_address', email.toLowerCase())
        .eq('sales_agent_id', agentId)
        .eq('is_active', true)
        .single();

      if (agentError || !agentData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Sales Agent ID does not match the registered email" 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (userType === 'developer') {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .select('developer_id')
        .eq('email_address', email.toLowerCase())
        .eq('developer_id', agentId)
        .eq('is_active', true)
        .single();

      if (devError || !devData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Developer ID does not match the registered email" 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clear any existing unused OTPs for this user
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('email', email.toLowerCase())
      .eq('user_type', userType)
      .eq('otp_type', 'password_reset')
      .eq('is_used', false);

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert([{
        user_id: userData.id,
        email: email.toLowerCase(),
        user_type: userType,
        otp_code: otp,
        otp_type: 'password_reset',
        expires_at: expiresAt.toISOString(),
        is_verified: false,
        is_used: false,
        attempts_count: 0,
        max_attempts: 3
      }]);

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate OTP. Please try again." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP email
    const userTypeLabel = userType === 'sales_agent' ? 'Sales Agent' : 'Developer';
    
    const emailResponse = await resend.emails.send({
      from: "EKARBOT <onboarding@resend.dev>",
      to: [email],
      subject: `EKARBOT - Password Reset OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://id-preview--f1244b2c-76d8-4d39-9aa6-62590b6914f8.lovable.app/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png" 
                 alt="EKARBOT" style="height: 40px;">
          </div>
          
          <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h1>
            <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">
              We received a password reset request for your ${userTypeLabel} account.
            </p>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.8;">${userTypeLabel} ID:</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold;">${agentId}</p>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.8;">Your OTP Code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.8;">
              This code will expire in 10 minutes for security reasons.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
              If you didn't request this password reset, please ignore this email.
            </p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              This is an automated message from EKARBOT. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Email sending error:', emailResponse.error);
      const err: any = emailResponse.error as any;
      const status = err?.statusCode === 403 ? 403 : 500;
      const message = err?.message || 'Failed to send OTP email. Please try again.';


      return new Response(
        JSON.stringify({ 
          success: false, 
          error: message 
        }),
        { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Password reset OTP sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully to your email",
        expiresIn: 600 // 10 minutes in seconds
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in forgot-password-send-otp function:", error);
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