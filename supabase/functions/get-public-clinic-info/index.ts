import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessSlug } = await req.json();
    
    if (!businessSlug) {
      return new Response(
        JSON.stringify({ error: 'Business slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get business info using new multi-business schema
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        tagline,
        logo_url,
        primary_color,
        secondary_color,
        business_hours,
        specialty_type,
        owner_profile_id
      `)
      .eq('slug', businessSlug)
      .maybeSingle();

    if (businessError) {
      console.error('Database error:', businessError);
      return new Response(
        JSON.stringify({ error: 'Error fetching business info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!businessData) {
      return new Response(
        JSON.stringify({ error: 'Clinic not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get owner profile and provider info
    const { data: ownerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', businessData.owner_profile_id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('specialization')
      .eq('profile_id', businessData.owner_profile_id)
      .maybeSingle();

    if (providerError) {
      console.error('Provider error:', providerError);
    }

    // Format response with public info only
    const response = {
      clinicId: businessData.id,
      dentistId: businessData.owner_profile_id,
      name: businessData.name,
      tagline: businessData.tagline,
      logoUrl: businessData.logo_url,
      primaryColor: businessData.primary_color,
      secondaryColor: businessData.secondary_color,
      businessHours: businessData.business_hours || {},
      specialtyType: businessData.specialty_type,
      doctorName: ownerProfile ? `Dr. ${ownerProfile.first_name} ${ownerProfile.last_name}` : 'Doctor',
      specialization: provider?.specialization || businessData.specialty_type,
      address: null, // Address removed from this version
      businessSlug: businessData.slug
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-public-clinic-info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});