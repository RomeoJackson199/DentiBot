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

    // Get clinic settings and dentist info
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_settings')
      .select(`
        id,
        clinic_name,
        tagline,
        logo_url,
        primary_color,
        secondary_color,
        business_hours,
        specialty_type,
        dentist_id,
        dentists!inner (
          id,
          specialization,
          clinic_address,
          profiles!inner (
            first_name,
            last_name
          )
        )
      `)
      .eq('business_slug', businessSlug)
      .maybeSingle();

    if (clinicError) {
      console.error('Database error:', clinicError);
      return new Response(
        JSON.stringify({ error: 'Error fetching clinic info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clinicData) {
      return new Response(
        JSON.stringify({ error: 'Clinic not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format response with public info only
    const response = {
      clinicId: clinicData.id,
      dentistId: clinicData.dentist_id,
      name: clinicData.clinic_name,
      tagline: clinicData.tagline,
      logoUrl: clinicData.logo_url,
      primaryColor: clinicData.primary_color,
      secondaryColor: clinicData.secondary_color,
      businessHours: clinicData.business_hours,
      specialtyType: clinicData.specialty_type,
      doctorName: `Dr. ${clinicData.dentists.profiles.first_name} ${clinicData.dentists.profiles.last_name}`,
      specialization: clinicData.dentists.specialization,
      address: clinicData.dentists.clinic_address,
      businessSlug
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