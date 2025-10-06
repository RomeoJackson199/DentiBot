import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  email: string;
  code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get stored code
    const { data: storedCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !storedCode) {
      console.error('Error fetching code:', fetchError);
      return new Response(
        JSON.stringify({ verified: false, error: 'Invalid or expired code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code matches and hasn't expired
    const now = new Date();
    const expiresAt = new Date(storedCode.expires_at);

    if (storedCode.code !== code) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Incorrect code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (storedCode.used) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Code has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('email', email);

    console.log('2FA code verified successfully for:', email);

    return new Response(
      JSON.stringify({ verified: true, message: 'Code verified successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-2fa-code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
