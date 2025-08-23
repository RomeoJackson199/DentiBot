import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const { profileId, email, firstName, lastName, dentistName }: InvitationEmailRequest = await req.json();

    console.log('Processing invitation email for:', { profileId, email, firstName, lastName, dentistName });

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

    // Send SMS using Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      throw new Error('Twilio configuration is incomplete. Missing account SID, auth token, or from number.');
    }

    // Create email message
    const emailMessage = `
Dear ${firstName} ${lastName},

You have been invited to join ${dentistName}'s dental practice portal.

Click the link below to create your account:
${invitationLink}

You will only need to set a password - all your information has been pre-filled.

This invitation expires in 72 hours.

Best regards,
${dentistName}
    `.trim();

    // Send via Twilio Email API (using SendGrid)
    const twilioEmailUrl = `https://email.twilio.com/v3/mail/send`;
    
    const emailData = {
      from: {
        email: "noreply@denti-smart.com",
        name: dentistName
      },
      personalizations: [
        {
          to: [{ email: email, name: `${firstName} ${lastName}` }],
          subject: `Invitation to join ${dentistName}'s dental practice`
        }
      ],
      content: [
        {
          type: "text/plain",
          value: emailMessage
        }
      ]
    };

    const emailResponse = await fetch(twilioEmailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('TWILIO_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Twilio email error:', errorText);
      throw new Error(`Failed to send email via Twilio: ${errorText}`);
    }

    console.log('Invitation email sent successfully via Twilio');

    return new Response(JSON.stringify({
      success: true,
      tokenId: tokenId,
      invitationLink: invitationLink,
      messageId: await emailResponse.text()
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