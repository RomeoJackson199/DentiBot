
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  messageType: 'appointment_confirmation' | 'appointment_reminder' | 'prescription' | 'emergency' | 'system';
  patientId?: string;
  dentistId?: string;
}

serve(async (req) => {
  console.log('📧 Email notification function called:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY');

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasTwilioKey: !!twilioApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    if (!twilioApiKey) {
      throw new Error('Twilio API key not configured');
    }

    // Parse request body
    const { to, subject, message, messageType, patientId, dentistId }: EmailRequest = await req.json();
    
    console.log('📋 Email request data:', {
      to: to?.substring(0, 5) + '...',
      subject,
      messageType,
      hasPatientId: !!patientId,
      hasDentistId: !!dentistId
    });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create email notification record
    let notificationId;
    if (patientId && dentistId) {
      console.log('💾 Creating email notification record...');
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
        console.error('❌ Error creating email notification record:', error);
      } else {
        notificationId = data.id;
        console.log('✅ Email notification record created:', notificationId);
      }
    }

    // Get dentist info for "from" field
    let fromEmail = 'noreply@dentalapp.com';
    let fromName = 'Dental App';
    
    if (dentistId) {
      console.log('👨‍⚕️ Fetching dentist info...');
      const { data: dentistProfile } = await supabase
        .from('dentists')
        .select(`
          profile:profiles(first_name, last_name)
        `)
        .eq('id', dentistId)
        .single();
      
      if (dentistProfile?.profile) {
        fromName = `Dr. ${dentistProfile.profile.first_name} ${dentistProfile.profile.last_name}`;
        console.log('✅ Dentist name set:', fromName);
      }
    }

    // Prepare email data for Twilio SendGrid
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This email was sent from your dental practice management system.
              </p>
            </div>
          </div>
        `
      }]
    };

    console.log('📤 Sending email via Twilio SendGrid...');

    // Send via Twilio SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${twilioApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('📬 SendGrid response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Twilio SendGrid error:', errorText);
      
      // Update notification status to failed
      if (notificationId) {
        await supabase
          .from('email_notifications')
          .update({ status: 'failed', error_message: errorText })
          .eq('id', notificationId);
      }
      
      throw new Error(`Failed to send email: ${response.status} ${errorText}`);
    }

    // Update notification status to sent
    if (notificationId) {
      console.log('✅ Updating notification status to sent...');
      await supabase
        .from('email_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_content: message
        })
        .eq('id', notificationId);
    }

    console.log('🎉 Email sent successfully via Twilio SendGrid!');

    return new Response(JSON.stringify({
      success: true,
      notificationId: notificationId,
      message: 'Email sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in email function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
