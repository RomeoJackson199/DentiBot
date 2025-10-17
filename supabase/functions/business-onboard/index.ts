// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function assertString(name: string, value: unknown, opts?: { min?: number; max?: number; pattern?: RegExp }) {
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  const v = value.trim();
  if (opts?.min && v.length < opts.min) throw new Error(`${name} is too short`);
  if (opts?.max && v.length > opts.max) throw new Error(`${name} is too long`);
  if (opts?.pattern && !opts.pattern.test(v)) throw new Error(`${name} has invalid characters`);
  return v;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return jsonResponse({ error: 'Missing server configuration' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json();
    const email = assertString('email', body.email, { max: 255 });
    const password = assertString('password', body.password, { min: 6, max: 256 });
    const firstName = assertString('firstName', body.firstName, { max: 100 });
    const lastName = assertString('lastName', body.lastName, { max: 100 });
    const specialtyType = assertString('specialtyType', body.specialtyType, { max: 50 });
    const businessSlug = assertString('businessSlug', body.businessSlug, { min: 3, max: 64, pattern: /^[a-z0-9-_.]+$/i });
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;

    // Optional template fields
    const template = body.template || {};

    // Check name availability (case-insensitive)
    const { data: existingClinic, error: clinicCheckError } = await supabase
      .from('clinic_settings')
      .select('id')
      .ilike('clinic_name', businessSlug)
      .maybeSingle();

    if (clinicCheckError) throw clinicCheckError;
    if (existingClinic) {
      return jsonResponse({ error: 'BUSINESS_NAME_TAKEN' }, 409);
    }

    const normalizedEmail = email.toLowerCase();

    // Get or create user (confirmed)
    const { data: existingUserRes } = await supabase.auth.admin.getUserByEmail(normalizedEmail);

    let userId: string;
    if (existingUserRes?.user) {
      userId = existingUserRes.user.id;
    } else {
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, role: 'dentist' }
      });
      if (createUserError || !createdUser?.user) {
        throw createUserError || new Error('Failed to create user');
      }
      userId = createdUser.user.id;
    }

    // Ensure profile exists
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (profileErr) throw profileErr;

    let profileId: string;
    if (!profile) {
      const { data: newProfile, error: insertProfileErr } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          role: 'dentist',
          phone: phone || null
        })
        .select('id')
        .maybeSingle();
      if (insertProfileErr || !newProfile) throw insertProfileErr || new Error('Failed to create profile');
      profileId = newProfile.id;
    } else {
      profileId = profile.id;
      if (phone) {
        await supabase.from('profiles').update({ phone }).eq('id', profileId);
      }
    }

    // Ensure dentist exists
    const { data: dentist, error: dentistErr } = await supabase
      .from('dentists')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (dentistErr) throw dentistErr;

    let dentistId: string;
    if (!dentist) {
      const { data: newDentist, error: insertDentistErr } = await supabase
        .from('dentists')
        .insert({ profile_id: profileId, is_active: true })
        .select('id')
        .maybeSingle();
      if (insertDentistErr || !newDentist) throw insertDentistErr || new Error('Failed to create dentist');
      dentistId = newDentist.id;
    } else {
      dentistId = dentist.id;
    }

    // Create clinic settings
    const insertPayload: any = {
      dentist_id: dentistId,
      clinic_name: businessSlug,
      specialty_type: specialtyType,
    };

    // Apply template if provided
    if (template) {
      if (template.primaryColor) insertPayload.primary_color = template.primaryColor;
      if (template.secondaryColor) insertPayload.secondary_color = template.secondaryColor;
      if (template.aiInstructions) insertPayload.ai_instructions = template.aiInstructions;
      if (template.aiTone) insertPayload.ai_tone = template.aiTone;
      if (template.welcomeMessage) insertPayload.welcome_message = template.welcomeMessage;
      if (template.appointmentKeywords) insertPayload.appointment_keywords = template.appointmentKeywords;
      if (template.emergencyKeywords) insertPayload.emergency_keywords = template.emergencyKeywords;
    }

    const { error: settingsError } = await supabase.from('clinic_settings').insert(insertPayload);
    if (settingsError) throw settingsError;

    return jsonResponse({ ok: true, userId });
  } catch (err: any) {
    console.error('business-onboard error', err);
    const message = typeof err?.message === 'string' ? err.message : 'Unexpected error';
    return jsonResponse({ error: message }, 400);
  }
});