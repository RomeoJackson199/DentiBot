import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        JSON.stringify({ error: 'businessSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching public business info for slug: ${businessSlug}`);

    // Get business info with owner profile and provider details
    const { data: business, error: businessError } = await supabase
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
        timezone,
        currency,
        owner_profile_id,
        profiles:owner_profile_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('slug', businessSlug)
      .maybeSingle();

    if (businessError) {
      console.error('Error fetching business:', businessError);
      throw businessError;
    }

    if (!business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get provider info for the owner
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, specialization')
      .eq('business_id', business.id)
      .eq('profile_id', business.owner_profile_id)
      .maybeSingle();

    if (providerError) {
      console.error('Error fetching provider:', providerError);
    }

    // Get active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, price_cents, description')
      .eq('business_id', business.id)
      .eq('is_active', true);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    }

    const ownerProfile = business.profiles as any;
    const providerName = ownerProfile 
      ? `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim()
      : '';

    const response = {
      businessId: business.id,
      providerId: provider?.id || '',
      name: business.name,
      tagline: business.tagline,
      logoUrl: business.logo_url,
      primaryColor: business.primary_color,
      secondaryColor: business.secondary_color,
      businessHours: business.business_hours,
      specialtyType: business.specialty_type,
      timezone: business.timezone,
      currency: business.currency,
      providerName,
      specialization: provider?.specialization,
      businessSlug: business.slug,
      services: services || []
    };

    console.log(`Successfully fetched business info for: ${business.name}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-public-business-info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
