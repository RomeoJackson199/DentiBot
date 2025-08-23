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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
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

    // Use Supabase's built-in invitation email system
    const siteUrl = Deno.env.get('SITE_URL') || 'https://gjvxcisbaxhhblhsytar.supabase.co';
    const invitationLink = `${siteUrl}/invite?token=${tokenId}`;

    // Send invitation using Supabase's auth admin
    const { data: emailResponse, error: emailError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: invitationLink,
        data: {
          first_name: firstName,
          last_name: lastName,
          dentist_name: dentistName,
          invitation_token: tokenId,
          role: 'patient'
        }
      }
    );

    if (emailError) {
      console.error('Failed to send invitation email:', emailError);
      throw new Error(`Failed to send invitation email: ${emailError.message}`);
    }

    console.log('Invitation email sent successfully via Supabase');

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse?.user?.id,
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