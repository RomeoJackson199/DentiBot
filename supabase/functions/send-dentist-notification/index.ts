import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      appointmentId,
      dentistName, 
      patientName, 
      appointmentDate, 
      appointmentTime, 
      reason,
      aiSummary 
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping email");
      return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get dentist email and full conversation transcript
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appointment details with dentist email
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        dentists!inner(
          email,
          profiles!inner(email)
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Could not fetch appointment details');
    }

    const dentistEmail = appointment.dentists.email || appointment.dentists.profiles.email;
    
    if (!dentistEmail) {
      throw new Error('Dentist email not found');
    }

    // Format conversation transcript
    let conversationHtml = '';
    if (appointment.conversation_transcript && Array.isArray(appointment.conversation_transcript)) {
      conversationHtml = appointment.conversation_transcript
        .map((msg: any) => `
          <div style="margin: 10px 0; padding: 10px; background: ${msg.is_bot ? '#f0f0f0' : '#e3f2fd'}; border-radius: 6px;">
            <strong>${msg.is_bot ? '🤖 AI Assistant' : '👤 Patient'}:</strong>
            <p style="margin: 5px 0 0 0;">${msg.message || msg.content || ''}</p>
          </div>
        `)
        .join('');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #0F3D91; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #66D2D6; }
            .summary-section { background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .transcript-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; max-height: 400px; overflow-y: auto; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #0F3D91; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Appointment Scheduled</h1>
            </div>
            <div class="content">
              <p>Dear Dr. ${dentistName.split(' ').pop()},</p>
              <p>A new appointment has been scheduled with you:</p>
              
              <div class="appointment-card">
                <div class="detail-row">
                  <span class="label">👤 Patient:</span> ${patientName}
                </div>
                <div class="detail-row">
                  <span class="label">📅 Date:</span> ${appointmentDate}
                </div>
                <div class="detail-row">
                  <span class="label">🕒 Time:</span> ${appointmentTime}
                </div>
                <div class="detail-row">
                  <span class="label">📝 Reason:</span> ${reason}
                </div>
              </div>

              <div class="summary-section">
                <h3 style="margin-top: 0; color: #f57c00;">🤖 AI-Generated Patient Summary</h3>
                <p>${aiSummary || 'No detailed summary available.'}</p>
              </div>

              ${conversationHtml ? `
                <div class="transcript-section">
                  <h3 style="margin-top: 0;">💬 Full Conversation Transcript</h3>
                  <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Complete AI chatbot conversation with the patient:</p>
                  ${conversationHtml}
                </div>
              ` : ''}

              <p style="margin-top: 30px; padding: 15px; background: #e8f5e9; border-radius: 6px;">
                <strong>💡 Tip:</strong> Review the AI summary and conversation transcript before the appointment to better understand the patient's concerns and provide more personalized care.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your dental practice management system</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Dental Practice <notifications@yourdomain.com>",
        to: [dentistEmail],
        subject: `New Appointment: ${patientName} - ${appointmentDate} at ${appointmentTime}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log("Dentist notification sent successfully:", data);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending dentist notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
