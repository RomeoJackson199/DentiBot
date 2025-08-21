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
  isSystemNotification?: boolean;
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

    const { to, subject, message, messageType, patientId, dentistId, isSystemNotification }: EmailRequest = await req.json();

    console.log('📧 Email request details:', { to, subject, messageType, patientId, dentistId, isSystemNotification });

    // Authorization check: Skip for system notifications, otherwise verify dentist access
    if (!isSystemNotification && dentistId && patientId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('id', dentistId)
        .eq('profile_id', userProfile.id)
        .single();

      if (dentistError || !dentist) {
        throw new Error('Unauthorized: Only the dentist can send email notifications');
      }
    } else if (isSystemNotification) {
      console.log('📧 System notification - skipping dentist authorization');
    }

    // Create email notification record (only for dentist-patient communications)
    let notificationId;
    if (patientId && dentistId && !isSystemNotification) {
      try {
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
          console.log('📝 Email notification record created:', notificationId);
        }
      } catch (recordError) {
        console.error('Failed to create email record, continuing with send:', recordError);
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

    // Send email using Twilio SendGrid
    const sendGridApiKey = Deno.env.get('TWILIO_API_KEY');
    if (!sendGridApiKey) {
      console.error('❌ TWILIO_API_KEY environment variable not set');
      throw new Error('SendGrid API key not configured - please set TWILIO_API_KEY environment variable');
    }

    console.log('🔑 SendGrid API key configured, proceeding with email send...');

    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: { 
        email: fromEmail,
        name: fromName
      },
      content: [{
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px;">
              This email was sent from your dental practice management system.
            </p>
          </div>
        `
      }]
    };

    // Send via Twilio SendGrid API
    console.log('🚀 Sending email to SendGrid API...');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('📡 SendGrid API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SendGrid API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Update notification status to failed
      if (notificationId) {
        try {
          await supabase
            .from('email_notifications')
            .update({ status: 'failed', error_message: errorText })
            .eq('id', notificationId);
        } catch (updateError) {
          console.error('Failed to update notification status:', updateError);
        }
      }
      
      throw new Error(`SendGrid API failed: ${response.status} - ${errorText}`);
    }

    // Update notification status to sent
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

    console.log(`Email sent successfully via Twilio SendGrid for ${messageType}`);

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