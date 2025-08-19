import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  dentistName: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Invitation email request received");
    const { profileId, email, firstName, lastName, dentistName }: InvitationEmailRequest = await req.json();

    // Generate a secure invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    console.log("Creating invitation token for profile:", profileId);

    // Store the invitation token in database
    const { error: insertError } = await supabase
      .from('invitation_tokens')
      .insert({
        profile_id: profileId,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        email: email
      });

    if (insertError) {
      console.error("Error storing invitation token:", insertError);
      throw new Error(`Failed to create invitation: ${insertError.message}`);
    }

    // Create invitation link
    const invitationLink = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/invite/${invitationToken}`;

    console.log("Sending invitation email to:", email);

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "DentiBot <onboarding@resend.dev>",
      to: [email],
      subject: `Welcome to DentiBot - Set up your account`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DentiBot</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to DentiBot!</h1>
              <p style="color: #666; font-size: 16px;">You've been invited by Dr. ${dentistName} to join our dental platform</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e40af; margin-bottom: 15px;">Hello ${firstName} ${lastName},</h2>
              <p style="margin-bottom: 15px;">Your dental records have been imported and your account is ready to be activated.</p>
              <p style="margin-bottom: 20px;">Click the button below to set up your password and access your dental information:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${invitationLink}" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Set Up My Account
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${invitationLink}" style="color: #2563eb; word-break: break-all;">${invitationLink}</a>
              </p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⏰ This invitation expires in 7 days.</strong> Please set up your account soon to maintain access to your dental records.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #666;">
              <p><strong>What you'll have access to:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Your complete dental history and records</li>
                <li>Appointment scheduling and management</li>
                <li>Treatment plans and recommendations</li>
                <li>Secure communication with Dr. ${dentistName}</li>
                <li>AI-powered dental health insights</li>
              </ul>
              
              <p style="margin-top: 20px;">If you have any questions, please contact Dr. ${dentistName}'s office directly.</p>
              
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                This email was sent because your dental records were imported into DentiBot. 
                If you believe this was sent in error, please contact the dental office directly.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      invitationId: emailResponse.data?.id,
      message: "Invitation email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);