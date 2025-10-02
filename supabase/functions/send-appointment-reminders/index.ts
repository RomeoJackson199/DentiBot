import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending reminders that need to be sent
    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabase
      .from("appointment_reminders")
      .select(`
        id,
        appointment_id,
        reminder_type,
        notification_method,
        appointments (
          id,
          appointment_date,
          reason,
          patient_id,
          dentist_id,
          profiles!appointments_patient_id_fkey (
            email,
            first_name,
            last_name,
            phone
          ),
          dentists (
            id,
            profiles (
              first_name,
              last_name,
              clinic_address
            )
          )
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to send`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const reminder of reminders || []) {
      try {
        const appointment = reminder.appointments as any;
        const patient = appointment.profiles;
        const dentist = appointment.dentists.profiles;

        if (!patient?.email) {
          console.log(`Skipping reminder ${reminder.id}: No patient email`);
          await supabase
            .from("appointment_reminders")
            .update({ 
              status: "failed", 
              error_message: "No patient email available" 
            })
            .eq("id", reminder.id);
          results.failed++;
          continue;
        }

        // Format the appointment date
        const appointmentDate = new Date(appointment.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        // Determine reminder timing text
        const reminderText = reminder.reminder_type === "24h" 
          ? "in 24 hours"
          : reminder.reminder_type === "2h"
          ? "in 2 hours"
          : "in 1 hour";

        // Send email notification
        const { error: emailError } = await supabase.functions.invoke(
          "send-email-notification",
          {
            body: {
              to: patient.email,
              subject: `Appointment Reminder - ${formattedDate}`,
              message: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2D5D7B;">Appointment Reminder</h2>
                  
                  <p>Hello ${patient.first_name},</p>
                  
                  <p>This is a friendly reminder that your dental appointment is coming up ${reminderText}.</p>
                  
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #1e293b;">Appointment Details:</h3>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                        <td style="padding: 8px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                        <td style="padding: 8px 0;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #475569;">Dentist:</td>
                        <td style="padding: 8px 0;">Dr. ${dentist.first_name} ${dentist.last_name}</td>
                      </tr>
                      ${appointment.reason ? `
                        <tr>
                          <td style="padding: 8px 0; font-weight: bold; color: #475569;">Reason:</td>
                          <td style="padding: 8px 0;">${appointment.reason}</td>
                        </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Important:</strong> Please arrive 10 minutes early for check-in. 
                      If you need to reschedule, please contact us at least 24 hours in advance.
                    </p>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    Thank you for choosing our dental practice. We look forward to seeing you soon!
                  </p>
                </div>
              `,
              messageType: "appointment_reminder",
              patientId: patient.id,
              dentistId: appointment.dentist_id,
              isSystemNotification: true,
            },
          }
        );

        if (emailError) {
          console.error(`Error sending email for reminder ${reminder.id}:`, emailError);
          await supabase
            .from("appointment_reminders")
            .update({ 
              status: "failed", 
              error_message: emailError.message 
            })
            .eq("id", reminder.id);
          results.failed++;
          results.errors.push(`Reminder ${reminder.id}: ${emailError.message}`);
        } else {
          await supabase
            .from("appointment_reminders")
            .update({ 
              status: "sent", 
              sent_at: new Date().toISOString() 
            })
            .eq("id", reminder.id);
          results.sent++;
          console.log(`Successfully sent reminder ${reminder.id}`);
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        await supabase
          .from("appointment_reminders")
          .update({ 
            status: "failed", 
            error_message: error.message 
          })
          .eq("id", reminder.id);
        results.failed++;
        results.errors.push(`Reminder ${reminder.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Processed ${results.sent + results.failed} reminders: ${results.sent} sent, ${results.failed} failed`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-appointment-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
