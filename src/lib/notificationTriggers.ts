import { NotificationService } from './notificationService';
import { supabase } from '../integrations/supabase/client';

export class NotificationTriggers {
  // Trigger notification when a new prescription is created
  static async onPrescriptionCreated(prescriptionId: string): Promise<void> {
    try {
      await NotificationService.createPrescriptionNotification(prescriptionId);
      console.log('Prescription notification created for:', prescriptionId);
    } catch (error) {
      console.error('Error creating prescription notification:', error);
    }
  }

  // Trigger notification when a treatment plan is created/updated
  static async onTreatmentPlanUpdated(
    treatmentPlanId: string,
    action: 'created' | 'updated' | 'completed'
  ): Promise<void> {
    try {
      await NotificationService.createTreatmentPlanNotification(treatmentPlanId, action);
      console.log('Treatment plan notification created for:', treatmentPlanId, action);
    } catch (error) {
      console.error('Error creating treatment plan notification:', error);
    }
  }

  // Trigger appointment reminder notifications
  static async scheduleAppointmentReminders(appointmentId: string): Promise<void> {
    try {
      // Schedule 24h reminder
      await NotificationService.createAppointmentReminder(appointmentId, '24h');
      
      // Schedule 2h reminder
      await NotificationService.createAppointmentReminder(appointmentId, '2h');
      
      console.log('Appointment reminders scheduled for:', appointmentId);
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }

  // Trigger notification when appointment is confirmed
  static async onAppointmentConfirmed(appointmentId: string): Promise<void> {
    try {
      // Get appointment core details
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('id, patient_id, dentist_id, appointment_date')
        .eq('id', appointmentId)
        .single();

      if (apptError || !appt) throw new Error('Appointment not found');

      // Get patient user id
      const { data: patientProfile, error: patientErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', appt.patient_id)
        .single();
      if (patientErr || !patientProfile) throw new Error('Patient profile not found');

      // Get dentist name
      const { data: dentistRow, error: dentistErr } = await supabase
        .from('dentists')
        .select('profile_id')
        .eq('id', appt.dentist_id)
        .single();
      if (dentistErr || !dentistRow) throw new Error('Dentist not found');

      const { data: dentistProfile, error: dentProfErr } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', dentistRow.profile_id)
        .single();
      if (dentProfErr || !dentistProfile) throw new Error('Dentist profile not found');

      const dentistName = `${dentistProfile.first_name} ${dentistProfile.last_name}`;

      await NotificationService.createNotification(
        patientProfile.user_id,
        'Appointment Confirmed',
        `Your appointment with Dr. ${dentistName} has been confirmed for ${new Date(appt.appointment_date).toLocaleDateString()}.`,
        'appointment',
        'success',
        `/appointments/${appointmentId}`,
        {
          appointment_id: appointmentId,
          dentist_name: dentistName,
          appointment_date: appt.appointment_date
        }
      );

      console.log('Appointment confirmation notification sent for:', appointmentId);
    } catch (error) {
      console.error('Error creating appointment confirmation notification:', error);
    }
  }

  // Trigger notification when appointment is cancelled
  static async onAppointmentCancelled(appointmentId: string): Promise<void> {
    try {
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('id, patient_id, dentist_id, appointment_date')
        .eq('id', appointmentId)
        .single();
      if (apptError || !appt) throw new Error('Appointment not found');

      const { data: patientProfile, error: patientErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', appt.patient_id)
        .single();
      if (patientErr || !patientProfile) throw new Error('Patient profile not found');

      const { data: dentistRow, error: dentistErr } = await supabase
        .from('dentists')
        .select('profile_id')
        .eq('id', appt.dentist_id)
        .single();
      if (dentistErr || !dentistRow) throw new Error('Dentist not found');

      const { data: dentistProfile, error: dentProfErr } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', dentistRow.profile_id)
        .single();
      if (dentProfErr || !dentistProfile) throw new Error('Dentist profile not found');

      const dentistName = `${dentistProfile.first_name} ${dentistProfile.last_name}`;

      await NotificationService.createNotification(
        patientProfile.user_id,
        'Appointment Cancelled',
        `Your appointment with Dr. ${dentistName} scheduled for ${new Date(appt.appointment_date).toLocaleDateString()} has been cancelled. Please contact us to reschedule.`,
        'appointment',
        'warning',
        `/appointments/${appointmentId}`,
        {
          appointment_id: appointmentId,
          dentist_name: dentistName,
          appointment_date: appt.appointment_date
        }
      );

      console.log('Appointment cancellation notification sent for:', appointmentId);
    } catch (error) {
      console.error('Error creating appointment cancellation notification:', error);
    }
  }

  // Trigger notification when prescription is expiring soon
  static async onPrescriptionExpiring(prescriptionId: string): Promise<void> {
    try {
      // Get prescription details
      const { data: rx, error: rxErr } = await supabase
        .from('prescriptions')
        .select('id, patient_id, medication_name, prescribed_date, duration_days')
        .eq('id', prescriptionId)
        .single();

      if (rxErr || !rx) throw new Error('Prescription not found');

      const { data: patientProfile, error: patientErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', rx.patient_id)
        .single();
      if (patientErr || !patientProfile) throw new Error('Patient profile not found');

      const baseDate = new Date(rx.prescribed_date);
      const duration = rx.duration_days ?? 0;
      const expiryDate = new Date(baseDate.getTime() + duration * 24 * 60 * 60 * 1000);
      const daysUntilExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      await NotificationService.createNotification(
        patientProfile.user_id,
        'Prescription Expiring Soon',
        `Your prescription for ${rx.medication_name} will expire in ${daysUntilExpiry} days. Please contact your dentist for a renewal.`,
        'prescription',
        'warning',
        `/prescriptions/${prescriptionId}`,
        {
          prescription_id: prescriptionId,
          medication_name: rx.medication_name,
          expiry_date: expiryDate.toISOString(),
          days_until_expiry: daysUntilExpiry
        }
      );

      console.log('Prescription expiry notification sent for:', prescriptionId);
    } catch (error) {
      console.error('Error creating prescription expiry notification:', error);
    }
  }

  // Trigger notification for emergency triage completion
  static async onEmergencyTriageCompleted(
    patientUserId: string,
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  ): Promise<void> {
    try {
      const urgencyMessages = {
        low: 'Your emergency assessment has been completed. Your condition is classified as low urgency.',
        medium: 'Your emergency assessment has been completed. Your condition requires attention within 24 hours.',
        high: 'Your emergency assessment has been completed. Your condition requires immediate attention.',
        emergency: 'Your emergency assessment has been completed. Please seek immediate medical attention.'
      };

      const urgencyCategories = {
        low: 'info',
        medium: 'warning',
        high: 'error',
        emergency: 'urgent'
      } as const;

      await NotificationService.createNotification(
        patientUserId,
        'Emergency Assessment Complete',
        urgencyMessages[urgencyLevel],
        'emergency',
        urgencyCategories[urgencyLevel],
        '/emergency',
        {
          urgency_level: urgencyLevel,
          assessment_completed: true
        }
      );

      console.log('Emergency triage notification sent for patient:', patientUserId);
    } catch (error) {
      console.error('Error creating emergency triage notification:', error);
    }
  }

  // Trigger notification for follow-up reminders
  static async onFollowUpReminder(
    patientUserId: string,
    followUpType: string,
    dueDate: string
  ): Promise<void> {
    try {
      await NotificationService.createNotification(
        patientUserId,
        'Follow-up Reminder',
        `You have a ${followUpType} follow-up due on ${new Date(dueDate).toLocaleDateString()}. Please contact your dentist to schedule.`,
        'follow_up',
        'warning',
        '/appointments',
        {
          follow_up_type: followUpType,
          due_date: dueDate
        }
      );

      console.log('Follow-up reminder notification sent for patient:', patientUserId);
    } catch (error) {
      console.error('Error creating follow-up reminder notification:', error);
    }
  }

  // Trigger notification for system maintenance
  static async onSystemMaintenance(
    maintenanceDate: string,
    duration: string,
    description: string
  ): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('user_id');

      if (error) {
        throw new Error('Failed to fetch users');
      }

      const usersList = (users ?? []) as Array<{ user_id: string }>;
      const notificationPromises = usersList.map(user =>
        NotificationService.createNotification(
          user.user_id,
          'System Maintenance Scheduled',
          `The system will be under maintenance on ${new Date(maintenanceDate).toLocaleDateString()} for ${duration}. ${description}`,
          'system',
          'info',
          undefined,
          {
            maintenance_date: maintenanceDate,
            duration: duration,
            description: description
          }
        )
      );

      await Promise.all(notificationPromises);
      console.log('System maintenance notifications sent to all users');
    } catch (error) {
      console.error('Error creating system maintenance notifications:', error);
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const deletedCount = await NotificationService.deleteExpiredNotifications();
      console.log(`Cleaned up ${deletedCount} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
}