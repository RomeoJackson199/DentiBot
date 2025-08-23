import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

interface Body {
  email: string;
  password?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({})) as Body;
    const email = (body?.email || '').trim().toLowerCase();
    const password = (body?.password || '').toString();

    if (!email || !email.includes('@')) {
      // Return generic error to avoid enumeration
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch profiles by email and determine claimable state server-side (avoids RLS exposure)
    const { data: profiles, error: qErr } = await admin
      .from('profiles')
      .select('id, email, user_id, first_name, last_name')
      .eq('email', email);

    if (qErr) {
      // On error, avoid leaking details
      return new Response(JSON.stringify({ claimable: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const claimable = (profiles || []).filter((p: any) => p.user_id === null);

    // If no password provided, this is a check-only call
    if (!password) {
      // Only claimable when exactly one unlinked profile exists
      const isClaimable = claimable.length === 1;
      return new Response(JSON.stringify({ claimable: isClaimable }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Password provided: attempt to create auth user and link
    if (claimable.length !== 1) {
      // Not found or ambiguous; return generic not found
      return new Response(JSON.stringify({ error: 'Not allowed' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const profile = claimable[0];

    // Create auth user with email confirmed (trusted clinic import)
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

    // Remove any auto-created profile row from signup trigger to avoid unique user_id conflicts
    await admin.from('profiles').delete().eq('user_id', userData.user.id);

    // Link imported profile to new user
    const { error: linkErr } = await admin
      .from('profiles')
      .update({ user_id: userData.user.id, profile_completion_status: 'incomplete' })
      .eq('id', profile.id);

    if (linkErr) {
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, profile_id: profile.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Unable to complete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});