import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AppointmentNotificationData {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  dentistName: string;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
  aiSummary?: string;
}

/**
 * Send email confirmation to patient after booking
 */
export const sendAppointmentConfirmation = async (data: AppointmentNotificationData) => {
  try {
    const { error } = await supabase.functions.invoke('send-appointment-confirmation', {
      body: {
        appointmentId: data.appointmentId,
        patientEmail: data.patientEmail,
        patientName: data.patientName,
        dentistName: data.dentistName,
        appointmentDate: format(data.appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointmentTime: data.appointmentTime,
        reason: data.reason,
      }
    });

    if (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send appointment confirmation:', error);
    return false;
  }
};

/**
 * Send notification to dentist with AI summary
 */
export const sendDentistNotification = async (data: AppointmentNotificationData) => {
  try {
    const { error } = await supabase.functions.invoke('send-dentist-notification', {
      body: {
        appointmentId: data.appointmentId,
        dentistName: data.dentistName,
        patientName: data.patientName,
        appointmentDate: format(data.appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointmentTime: data.appointmentTime,
        reason: data.reason,
        aiSummary: data.aiSummary || 'No AI summary available',
      }
    });

    if (error) {
      console.error('Error sending dentist notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send dentist notification:', error);
    return false;
  }
};
