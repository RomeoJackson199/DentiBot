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
      patientEmail, 
      patientName, 
      dentistName, 
      appointmentDate, 
      appointmentTime, 
      reason 
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping email");
      return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get business details for branding
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: business } = await supabase
      .from('businesses')
      .select('name, address, phone')
      .limit(1)
      .single();

    const clinicName = business?.name || 'Our Dental Clinic';
    const clinicAddress = business?.address || '';
    const clinicPhone = business?.phone || '';

    // Generate calendar invite link
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Dental+Appointment+with+${encodeURIComponent(dentistName)}&dates=${appointmentDate.replace(/-/g, '')}T${appointmentTime.replace(':', '')}00/${appointmentDate.replace(/-/g, '')}T${appointmentTime.replace(':', '')}00&details=${encodeURIComponent(reason)}&location=${encodeURIComponent(clinicAddress)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0F3D91; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #66D2D6; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #0F3D91; }
            .button { display: inline-block; padding: 12px 24px; background: #0F3D91; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <p>Your dental appointment has been successfully scheduled!</p>
              
              <div class="appointment-card">
                <div class="detail-row">
                  <span class="label">📅 Date:</span> ${appointmentDate}
                </div>
                <div class="detail-row">
                  <span class="label">🕒 Time:</span> ${appointmentTime}
                </div>
                <div class="detail-row">
                  <span class="label">👨‍⚕️ Dentist:</span> ${dentistName}
                </div>
                <div class="detail-row">
                  <span class="label">📝 Reason:</span> ${reason}
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${calendarUrl}" class="button">📅 Add to Calendar</a>
              </div>

              <h3>What to Bring:</h3>
              <ul>
                <li>Valid ID</li>
                <li>Insurance card (if applicable)</li>
                <li>List of current medications</li>
                <li>Previous dental records (if first visit)</li>
              </ul>

              <h3>Clinic Information:</h3>
              <p>
                <strong>${clinicName}</strong><br>
                ${clinicAddress ? `${clinicAddress}<br>` : ''}
                ${clinicPhone ? `Phone: ${clinicPhone}` : ''}
              </p>

              <p style="margin-top: 30px;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email from ${clinicName}</p>
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
        from: "Dental Clinic <appointments@yourdomain.com>",
        to: [patientEmail],
        subject: `Appointment Confirmation - ${appointmentDate} at ${appointmentTime}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending appointment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
