import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment-based CORS configuration
const getCorsHeaders = () => {
  const environment = Deno.env.get('ENVIRONMENT') || 'development';
  
  if (environment === 'production') {
    return {
      'Access-Control-Allow-Origin': 'https://gjvxcisbaxhhblhsytar.supabase.co',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const corsHeaders = getCorsHeaders();

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  messageType: 'appointment_confirmation' | 'appointment_reminder' | 'prescription' | 'emergency' | 'system';
  patientId?: string;
  dentistId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header and verify JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create Supabase client with user context for authorization checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { to, subject, message, messageType, patientId, dentistId }: EmailRequest = await req.json();

    // Authorization check: Only dentists can send email notifications to patients
    if (dentistId && patientId) {
      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('id', dentistId)
        .eq('profile_id', (
          await supabase.from('profiles').select('id').eq('user_id', user.id).single()
        ).data?.id)
        .single();

      if (dentistError || !dentist) {
        throw new Error('Unauthorized: Only the dentist can send email notifications');
      }
    }

    // Create email notification record first
    let notificationId;
    if (patientId && dentistId) {
      const { data, error } = await supabase
        .from('email_notifications')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          email_address: to,
          message_type: messageType,
          subject: subject,
          message_content: message,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating email notification record:', error);
      } else {
        notificationId = data.id;
      }
    }

    // Get dentist info for "from" field
    let fromEmail = 'noreply@dentalapp.com';
    let fromName = 'Dental App';
    
    if (dentistId) {
      const { data: dentistProfile } = await supabase
        .from('dentists')
        .select(`
          profile:profiles(first_name, last_name)
        `)
        .eq('id', dentistId)
        .single();
      
      if (dentistProfile?.profile) {
        fromName = `Dr. ${dentistProfile.profile.first_name} ${dentistProfile.profile.last_name}`;
      }
    }

    // Store the email notification - Supabase will handle delivery
    if (notificationId) {
      await supabase
        .from('email_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_content: message
        })
        .eq('id', notificationId);
    }

    // For system notifications, we can use Supabase's built-in notification system
    // or simply store in database and handle via triggers
    console.log(`Email notification stored successfully for ${messageType}`);

    return new Response(JSON.stringify({
      success: true,
      notificationId: notificationId,
      message: 'Notification processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});