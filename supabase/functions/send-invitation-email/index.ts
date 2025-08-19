import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

interface InvitationEmailRequest {
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  dentistName: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { profileId, email, firstName, lastName, dentistName }: InvitationEmailRequest = await req.json();

    console.log('Processing invitation email for:', { profileId, email, firstName, lastName, dentistName });

    // Generate invitation token
    const { data: tokenId, error: tokenError } = await supabase
      .rpc('create_invitation_token', {
        p_profile_id: profileId,
        p_email: email,
        p_expires_hours: 72
      });

    if (tokenError) {
      console.error('Failed to create invitation token:', tokenError);
      throw new Error(`Failed to create invitation token: ${tokenError.message}`);
    }

    console.log('Invitation token created:', tokenId);

    // Generate invitation link - use the frontend URL
    const siteUrl = Deno.env.get('SITE_URL') || 'https://gjvxcisbaxhhblhsytar.supabase.co';
    const invitationLink = `${siteUrl}/invite?token=${tokenId}`;

    console.log('Generated invitation link:', invitationLink);

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: 'DentiBot <noreply@resend.dev>',
      to: [email],
      subject: `Welcome to DentiBot - Complete Your Profile Setup`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to DentiBot!</h1>
          
          <p>Hello ${firstName} ${lastName},</p>
          
          <p>You've been added as a patient by <strong>${dentistName}</strong>. To complete your profile setup and start using DentiBot, please click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Setup</a>
          </div>
          
          <p>This invitation will expire in 72 hours. If you have any questions, please contact your dentist directly.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${invitationLink}">${invitationLink}</a>
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      tokenId: tokenId,
      invitationLink: invitationLink
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send invitation email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});