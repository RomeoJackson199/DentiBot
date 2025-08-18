import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const resend = new Resend(resendApiKey);
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

    // Create HTML email template based on message type
    const getEmailTemplate = (type: string, content: string) => {
      const baseStyle = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">${fromName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Dental Care Notification</p>
          </div>
          <div style="padding: 30px; background: white;">
            ${content}
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 14px;">This is an automated message from your dental care team.</p>
          </div>
        </div>
      `;

      switch (type) {
        case 'appointment_confirmation':
          return baseStyle.replace('${content}', `
            <h2 style="color: #2563eb; margin-top: 0;">Appointment Confirmed</h2>
            <p>${content}</p>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>📅 Please save this date in your calendar</strong>
            </div>
          `);
        case 'appointment_reminder':
          return baseStyle.replace('${content}', `
            <h2 style="color: #dc2626; margin-top: 0;">Appointment Reminder</h2>
            <p>${content}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>⏰ Don't forget your upcoming appointment!</strong>
            </div>
          `);
        case 'prescription':
          return baseStyle.replace('${content}', `
            <h2 style="color: #059669; margin-top: 0;">New Prescription</h2>
            <p>${content}</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>💊 Please follow the prescribed instructions carefully</strong>
            </div>
          `);
        case 'emergency':
          return baseStyle.replace('${content}', `
            <h2 style="color: #dc2626; margin-top: 0;">⚠️ Emergency Notification</h2>
            <p style="font-weight: bold; color: #dc2626;">${content}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <strong>Please contact us immediately if you need urgent care</strong>
            </div>
          `);
        default:
          return baseStyle.replace('${content}', `
            <h2 style="color: #4f46e5; margin-top: 0;">Notification</h2>
            <p>${content}</p>
          `);
      }
    };

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: getEmailTemplate(messageType, message),
    });

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    // Update email notification record with Resend response
    if (notificationId) {
      await supabase
        .from('email_notifications')
        .update({
          resend_id: emailResponse.data?.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    }

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      notificationId
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