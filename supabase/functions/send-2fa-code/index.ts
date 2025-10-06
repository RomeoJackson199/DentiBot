import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: EmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Supabase with 10 minute expiry
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store the code
    const { error: storeError } = await supabase
      .from('verification_codes')
      .upsert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: 'email'
      });

    if (storeError) {
      console.error('Error storing code:', storeError);
      throw storeError;
    }

    // Send email with code using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DentiBot Security <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Two-Factor Authentication Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0F3D91; margin: 0;">Two-Factor Authentication</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Your verification code is:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0F3D91;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                This code will expire in 10 minutes.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Reminder:</strong> Never share this code with anyone. Our team will never ask for your verification code.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log('2FA code sent successfully to:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-2fa-code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
