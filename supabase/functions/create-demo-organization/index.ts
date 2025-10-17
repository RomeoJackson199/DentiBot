import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create demo organization function invoked');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, industry_type, business_name } = await req.json();
    
    console.log('Request data:', { user_id, industry_type, business_name });

    if (!user_id || !industry_type || !business_name) {
      throw new Error('Missing required fields');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Create demo organization
    const demoExpiresAt = new Date();
    demoExpiresAt.setDate(demoExpiresAt.getDate() + 14); // 14 day trial

    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .insert({
        name: business_name,
        industry_type,
        subscription_tier: 'free',
        subscription_status: 'trialing',
        is_demo: true,
        demo_expires_at: demoExpiresAt.toISOString(),
        trial_ends_at: demoExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error('Failed to create organization: ' + orgError?.message);
    }

    // Add user as owner
    const { error: memberError } = await supabaseClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        profile_id: profile.id,
        role: 'owner',
      });

    if (memberError) {
      throw new Error('Failed to add organization member: ' + memberError.message);
    }

    // Create organization settings
    const { error: settingsError } = await supabaseClient
      .from('organization_settings')
      .insert({
        organization_id: org.id,
        business_name,
        industry_type,
        terminology: getIndustryTerminology(industry_type),
      });

    if (settingsError) {
      throw new Error('Failed to create settings: ' + settingsError.message);
    }

    // Generate sample data
    await generateSampleData(supabaseClient, org.id, profile.id, industry_type);

    // Mark demo data as generated
    await supabaseClient
      .from('organizations')
      .update({ demo_data_generated: true })
      .eq('id', org.id);

    return new Response(JSON.stringify({ 
      success: true, 
      organization: org 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating demo organization:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

function getIndustryTerminology(industry: string) {
  const terminology: Record<string, any> = {
    healthcare: {
      provider: 'Doctor',
      client: 'Patient',
      appointment: 'Appointment',
      service: 'Treatment',
    },
    fitness: {
      provider: 'Trainer',
      client: 'Member',
      appointment: 'Session',
      service: 'Workout',
    },
    beauty: {
      provider: 'Stylist',
      client: 'Client',
      appointment: 'Appointment',
      service: 'Service',
    },
    consulting: {
      provider: 'Consultant',
      client: 'Client',
      appointment: 'Meeting',
      service: 'Consultation',
    },
    legal: {
      provider: 'Attorney',
      client: 'Client',
      appointment: 'Consultation',
      service: 'Legal Service',
    },
    education: {
      provider: 'Instructor',
      client: 'Student',
      appointment: 'Class',
      service: 'Lesson',
    },
  };

  return terminology[industry] || terminology.consulting;
}

async function generateSampleData(
  supabase: any,
  orgId: string,
  ownerId: string,
  industry: string
) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Create sample provider (dentist in original schema)
  const { data: dentist, error: dentistError } = await supabase
    .from('dentists')
    .insert({
      profile_id: ownerId,
      is_active: true,
      specialty: getSampleSpecialty(industry),
    })
    .select()
    .single();

  if (dentistError) {
    console.error('Error creating sample dentist:', dentistError);
    return;
  }

  // Create sample clients (patients)
  const sampleClients = [
    { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.demo@example.com', phone: '555-0101' },
    { first_name: 'Michael', last_name: 'Chen', email: 'michael.demo@example.com', phone: '555-0102' },
    { first_name: 'Emily', last_name: 'Davis', email: 'emily.demo@example.com', phone: '555-0103' },
    { first_name: 'James', last_name: 'Wilson', email: 'james.demo@example.com', phone: '555-0104' },
  ];

  const clients = [];
  for (const client of sampleClients) {
    const { data: profile } = await supabase
      .from('profiles')
      .insert({
        ...client,
        role: 'patient',
        organization_id: orgId,
      })
      .select()
      .single();
    
    if (profile) {
      clients.push(profile);
    }
  }

  // Create sample appointments
  const appointmentReasons = getSampleReasons(industry);
  
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const appointmentDate = new Date(tomorrow);
    appointmentDate.setHours(9 + i * 2, 0, 0, 0);

    await supabase
      .from('appointments')
      .insert({
        patient_id: client.id,
        dentist_id: dentist.id,
        organization_id: orgId,
        appointment_date: appointmentDate.toISOString(),
        reason: appointmentReasons[i % appointmentReasons.length],
        status: i % 3 === 0 ? 'confirmed' : i % 3 === 1 ? 'pending' : 'completed',
        urgency: i % 2 === 0 ? 'medium' : 'low',
        duration_minutes: 60,
        patient_name: `${client.first_name} ${client.last_name}`,
      });
  }

  console.log(`Generated ${clients.length} sample clients and ${clients.length} appointments`);
}

function getSampleSpecialty(industry: string): string {
  const specialties: Record<string, string> = {
    healthcare: 'General Practice',
    fitness: 'Personal Training',
    beauty: 'Hair Styling',
    consulting: 'Business Strategy',
    legal: 'General Law',
    education: 'Private Tutoring',
  };
  return specialties[industry] || 'General';
}

function getSampleReasons(industry: string): string[] {
  const reasons: Record<string, string[]> = {
    healthcare: ['Regular Checkup', 'Follow-up Visit', 'Consultation', 'Treatment'],
    fitness: ['Initial Assessment', 'Personal Training', 'Fitness Consultation', 'Workout Session'],
    beauty: ['Haircut', 'Color Treatment', 'Styling', 'Consultation'],
    consulting: ['Strategy Session', 'Business Review', 'Planning Meeting', 'Follow-up'],
    legal: ['Legal Consultation', 'Document Review', 'Case Discussion', 'Initial Consultation'],
    education: ['Lesson', 'Progress Review', 'Assessment', 'Tutorial'],
  };
  return reasons[industry] || reasons.consulting;
}
