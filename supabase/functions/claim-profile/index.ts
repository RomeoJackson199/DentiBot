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
  console.log('Claim profile function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check - URL exists:', !!supabaseUrl, 'Key exists:', !!serviceKey);
    
    if (!supabaseUrl || !serviceKey) {
      console.log('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({})) as Body;
    const email = (body?.email || '').trim().toLowerCase();
    const password = (body?.password || '').toString();

    console.log('Request data - Email:', email, 'Has password:', !!password);

    if (!email || !email.includes('@')) {
      console.log('Invalid email format');
      return new Response(JSON.stringify({ error: 'Invalid request' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch profiles by email and determine claimable state server-side
    console.log('Fetching profiles for email:', email);
    const { data: profiles, error: qErr } = await admin
      .from('profiles')
      .select('id, email, user_id, first_name, last_name')
      .ilike('email', email);

    console.log('Profile query result:', profiles, 'Error:', qErr);

    if (qErr) {
      console.log('Query error:', qErr);
      return new Response(JSON.stringify({ claimable: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const claimable = (profiles || []).filter((p: any) => p.user_id === null);
    console.log('Claimable profiles:', claimable.length);

    // If no password provided, this is a check-only call
    if (!password) {
      const isClaimable = claimable.length === 1;
      console.log('Check-only call, claimable:', isClaimable);
      return new Response(JSON.stringify({ claimable: isClaimable }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Password provided: attempt to create auth user and link
    if (claimable.length !== 1) {
      console.log('No single claimable profile found:', claimable.length);
      return new Response(JSON.stringify({ error: 'Not allowed' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const profile = claimable[0];
    console.log('Claiming profile:', profile.id);

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

    console.log('User creation result:', userData?.user?.id, 'Error:', createErr);

    // If the user already exists in auth, return a specific error
    if (createErr && (createErr as any)?.message?.includes('User already registered')) {
      console.log('User already exists');
      return new Response(
        JSON.stringify({ error: 'USER_EXISTS' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (createErr || !userData?.user) {
      const message = (createErr as any)?.message || 'Unable to complete';
      console.log('User creation failed:', message);
      return new Response(JSON.stringify({ error: message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Remove any auto-created profile row from signup trigger to avoid conflicts
    console.log('Removing auto-created profile for user:', userData.user.id);
    await admin.from('profiles').delete().eq('user_id', userData.user.id);

    // Link imported profile to new user
    console.log('Linking profile to user');
    const { error: linkErr } = await admin
      .from('profiles')
      .update({ 
        user_id: userData.user.id, 
        profile_completion_status: 'incomplete' 
      })
      .eq('id', profile.id);

    console.log('Profile linking result, error:', linkErr);

    if (linkErr) {
      console.log('Profile linking failed:', linkErr);
      return new Response(JSON.stringify({ error: 'Unable to complete' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Successfully claimed profile:', profile.id);
    return new Response(JSON.stringify({ ok: true, profile_id: profile.id }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.log('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unable to complete' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});