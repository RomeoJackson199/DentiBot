import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

interface Body {
  email: string;
  password: string;
  profileId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fail secure: default to production if no environment is set
    const mode = Deno.env.get('MODE') || Deno.env.get('ENV') || Deno.env.get('NODE_ENV') || 'production';
    const isProduction = mode === 'production';

    if (isProduction) {
      return new Response(JSON.stringify({ error: 'Not available' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, password, profileId } = await req.json() as Body;
    if (!email || !password || !profileId) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify target profile exists and is claimable
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, email, user_id, first_name, last_name')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Not allowed' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (profile.user_id !== null) {
      // Already claimed
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check duplicates by email
    const { data: dupProfiles, error: dupErr } = await admin
      .from('profiles')
      .select('id')
      .eq('email', profile.email);

    if (dupErr) {
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if ((dupProfiles || []).filter(p => p.id !== profile.id).length > 0) {
      // Duplicate email rows exist, avoid leaking info
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create auth user with email confirmed
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        claim_existing_profile: profile.id
      }
    });

    if (createErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Link profile to user
    const { error: linkErr } = await admin
      .from('profiles')
      .update({ user_id: userData.user.id, profile_completion_status: 'incomplete' })
      .eq('id', profile.id);

    if (linkErr) {
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});