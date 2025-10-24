import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetBusinessRequest {
  businessId?: string;
  businessSlug?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { businessId, businessSlug }: SetBusinessRequest = await req.json();

    // Get profile_id for current user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve business by ID or slug
    let targetBusinessId = businessId;
    if (!targetBusinessId && businessSlug) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', businessSlug)
        .single();

      if (businessError || !business) {
        return new Response(JSON.stringify({ error: 'Business not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetBusinessId = business.id;
    }

    if (!targetBusinessId) {
      return new Response(JSON.stringify({ error: 'Business ID or slug required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify membership
    const { data: membership, error: membershipError } = await supabase
      .from('business_members')
      .select('role')
      .eq('profile_id', profile.id)
      .eq('business_id', targetBusinessId)
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'Not a member of this business' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update session_business table (fallback for JWT)
    await supabase
      .from('session_business')
      .upsert({
        user_id: user.id,
        business_id: targetBusinessId,
        updated_at: new Date().toISOString(),
      });

    // Return success with business context
    return new Response(
      JSON.stringify({
        success: true,
        businessId: targetBusinessId,
        role: membership.role,
        message: 'Business context set successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in set-current-business:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
