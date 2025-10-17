// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Server configuration error');
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    
    // Validate inputs
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const specialtyType = String(body.specialtyType || '').trim();
    const businessSlug = String(body.businessSlug || '').trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const template = body.template || {};

    if (!email || !password || !firstName || !lastName || !specialtyType || !businessSlug) {
      throw new Error('Missing required fields');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check business name availability
    const { data: existingClinic } = await supabase
      .from('clinic_settings')
      .select('id')
      .ilike('clinic_name', businessSlug)
      .maybeSingle();

    if (existingClinic) {
      return new Response(JSON.stringify({ error: 'BUSINESS_NAME_TAKEN' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    let userId: string;
    const { data: existingUserData } = await supabase.auth.admin.listUsers();
    const existingUser = existingUserData?.users?.find(u => u.email?.toLowerCase() === email);

    if (existingUser) {
      console.log('User already exists, using existing account:', existingUser.id);
      userId = existingUser.id;
      
      // Update user metadata to include dentist role
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'dentist'
        }
      });
    } else {
      // Create new user (email_confirm: true skips verification)
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'dentist'
        }
      });

      if (userError || !userData?.user) {
        console.error('User creation error:', userError);
        throw new Error('Failed to create user account');
      }

      userId = userData.user.id;
    }

    // Wait a bit for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'dentist',
          phone
        })
        .select('id')
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create profile');
      }
      profile = newProfile;
    } else if (phone) {
      await supabase.from('profiles').update({ phone }).eq('id', profile.id);
    }

    // Create dentist record
    const { data: dentist, error: dentistError } = await supabase
      .from('dentists')
      .insert({
        profile_id: profile.id,
        is_active: true
      })
      .select('id')
      .single();

    if (dentistError) {
      console.error('Dentist creation error:', dentistError);
      throw new Error('Failed to create dentist record');
    }

    // Create clinic settings
    const { error: clinicError } = await supabase
      .from('clinic_settings')
      .insert({
        dentist_id: dentist.id,
        clinic_name: businessSlug,
        specialty_type: specialtyType,
        primary_color: template.primaryColor || '#0F3D91',
        secondary_color: template.secondaryColor || '#66D2D6',
        ai_instructions: template.aiInstructions,
        ai_tone: template.aiTone,
        welcome_message: template.welcomeMessage,
        appointment_keywords: template.appointmentKeywords,
        emergency_keywords: template.emergencyKeywords
      });

    if (clinicError) {
      console.error('Clinic creation error:', clinicError);
      throw new Error('Failed to create clinic settings');
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('business-onboard error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});