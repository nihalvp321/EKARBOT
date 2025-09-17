// @ts-nocheck

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  userType: 'sales_agent' | 'developer';
  agentId: string;
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("OTP email request received");
    
    const { userType, agentId, email, otp }: OTPEmailRequest = await req.json();

    console.log(`Sending OTP to ${email} for ${userType} ${agentId}`);

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
              This code will expire in 5 minutes for security reasons.
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

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "OTP sent successfully",
      id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send OTP email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);