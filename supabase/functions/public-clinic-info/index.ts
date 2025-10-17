import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessSlug } = await req.json();

    if (!businessSlug || typeof businessSlug !== 'string') {
      return new Response(
        JSON.stringify({ error: 'businessSlug is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Looking up clinic with businessSlug:', businessSlug);

    // Query clinic_settings with case-insensitive match on clinic_name
    // businessSlug is derived from clinic_name, so we match on it
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_settings')
      .select('clinic_name, tagline, logo_url, primary_color, secondary_color, specialty_type')
      .ilike('clinic_name', businessSlug)
      .single();

    if (clinicError && clinicError.code !== 'PGRST116') {
      console.error('Error fetching clinic:', clinicError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clinic information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PGRST116 means no rows returned
    if (!clinicData) {
      console.log('Clinic not found for businessSlug:', businessSlug);
      return new Response(
        JSON.stringify({ exists: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Clinic found:', clinicData.clinic_name);

    // Return sanitized public information
    return new Response(
      JSON.stringify({
        exists: true,
        clinic: {
          clinic_name: clinicData.clinic_name,
          tagline: clinicData.tagline || null,
          logo_url: clinicData.logo_url || null,
          primary_color: clinicData.primary_color || '#0F3D91',
          secondary_color: clinicData.secondary_color || '#66D2D6',
          specialty_type: clinicData.specialty_type || 'dentist',
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in public-clinic-info:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
