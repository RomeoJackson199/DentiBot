import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PatientEmailRequest {
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
    
    const { profileId, email, firstName, lastName, dentistName }: PatientEmailRequest = await req.json();

    console.log('Processing patient email for:', { profileId, email, firstName, lastName, dentistName });

    // Generate invitation token
    const { data: tokenId, error: tokenError } = await supabase
      .rpc('create_invitation_token_with_cleanup', {
        p_profile_id: profileId,
        p_email: email,
        p_expires_hours: 72
      });

    if (tokenError) {
      console.error('Failed to create invitation token:', tokenError);
      throw new Error(`Failed to create invitation token: ${tokenError.message}`);
    }

    console.log('Invitation token created:', tokenId);

    // Create invitation link to our app
    const invitationLink = `${Deno.env.get('SITE_URL') || 'https://preview--dentibot.lovable.app'}/invite?token=${tokenId}`;

    // Create email content
    const emailSubject = `Invitation to join ${dentistName}'s dental practice`;
    const emailHtml = `
      <h2>Welcome to ${dentistName}'s Dental Practice!</h2>
      <p>Dear ${firstName} ${lastName},</p>
      
      <p>You have been invited to join ${dentistName}'s dental practice portal.</p>
      
      <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Create Your Account</a></p>
      
      <p>You will only need to set a password - all your information has been pre-filled.</p>
      
      <p><strong>This invitation expires in 72 hours.</strong></p>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:<br>
      ${invitationLink}</p>
      
      <p>Best regards,<br>${dentistName}</p>
    `;

    // Send email using the existing transactional email function
    const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        to: email,
        subject: emailSubject,
        html: emailHtml,
        metadata: {
          type: 'patient_invitation',
          profileId: profileId,
          tokenId: tokenId
        }
      }
    });

    if (emailError) {
      console.error('Failed to send email:', emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log('Patient invitation email sent successfully');

    return new Response(JSON.stringify({
      success: true,
      tokenId: tokenId,
      invitationLink: invitationLink
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-patient-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send patient email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});