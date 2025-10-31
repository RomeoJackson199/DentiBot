// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_TEMPLATES, EVENT_SCHEMAS, RATE_LIMITS, EmailEvent, EmailTemplate } from "./emailTemplates";
import { logger } from '@/lib/logger';

export class EventEmailService {
  private static instance: EventEmailService;
  
  static getInstance(): EventEmailService {
    if (!EventEmailService.instance) {
      EventEmailService.instance = new EventEmailService();
    }
    return EventEmailService.instance;
  }

  /**
   * Process an email event and send if rate limits allow
   */
  async processEmailEvent(event: EmailEvent): Promise<{ success: boolean; reason?: string }> {
    try {
      // Check idempotency
      const existingEmail = await this.checkIdempotency(event.idempotency_key);
      if (existingEmail) {
        return { success: false, reason: 'Duplicate event - email already sent' };
      }

      // Get template for event
      const template = EMAIL_TEMPLATES[event.event as keyof typeof EMAIL_TEMPLATES];
      if (!template) {
        return { success: false, reason: `No template found for event: ${event.event}` };
      }

      // Check rate limits (skip for essential emails)
      if (template.priority !== 'essential') {
        const rateLimitCheck = await this.checkRateLimit(event.patient_id, template.priority);
        if (!rateLimitCheck.allowed) {
          return { success: false, reason: rateLimitCheck.reason };
        }
      }

      // Get patient and clinic data
      const contextData = await this.getEmailContext(event);
      if (!contextData) {
        return { success: false, reason: 'Failed to get patient/clinic context' };
      }

      // Render email content
      const renderedEmail = this.renderTemplate(template, event, contextData);

      // Generate attachments if needed
      const attachments = await this.generateAttachments(event, template, contextData);

      // Send email via edge function
      const emailResult = await this.sendTransactionalEmail({
        to: contextData.patient_email,
        subject: renderedEmail.subject,
        html: renderedEmail.body,
        attachments,
        metadata: {
          event_type: event.event,
          patient_id: event.patient_id,
          appointment_id: event.appointment_id,
          template_id: event.event,
          idempotency_key: event.idempotency_key
        }
      });

      // Log the sent email
      await this.logEmailEvent({
        event_type: event.event,
        patient_id: event.patient_id,
        appointment_id: event.appointment_id,
        template_id: event.event,
        message_id: emailResult.message_id,
        idempotency_key: event.idempotency_key,
        sent_at: new Date().toISOString(),
        tenant_id: contextData.clinic_id
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing email event:', error);
      return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if email was already sent using idempotency key
   */
  private async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    // Use existing email_notifications table for now
    const { data } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('message_content', idempotencyKey) // Store idempotency key in message_content temporarily
      .maybeSingle();
    
    return !!data;
  }

  /**
   * Check rate limits for non-essential emails
   */
  private async checkRateLimit(patientId: string, priority: 'important' | 'normal'): Promise<{ allowed: boolean; reason?: string }> {
    const limit = RATE_LIMITS[priority];
    if (!limit) return { allowed: true };

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Use existing email_notifications table for rate limiting
    const { data, error } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('patient_id', patientId)
      .gte('created_at', twentyFourHoursAgo);

    if (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true }; // Allow on error to avoid blocking essential communications
    }

    if (data && data.length >= limit) {
      return { 
        allowed: false, 
        reason: `Rate limit exceeded: ${data.length}/${limit} ${priority} emails sent in last 24h` 
      };
    }

    return { allowed: true };
  }

  /**
   * Get patient and clinic context for email rendering
   */
  private async getEmailContext(event: EmailEvent) {
    const { data: patient } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', event.patient_id)
      .maybeSingle();

    if (!patient) return null;

    // Get clinic info (assuming first dentist for now - could be enhanced)
    const { data: clinic } = await supabase
      .from('dentists')
      .select(`
        id,
        clinic_address,
        profiles!inner(first_name, last_name, email, phone)
      `)
      .limit(1)
      .maybeSingle();

    return {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_email: patient.email,
      patient_language: 'en', // Default to English for now
      clinic_name: clinic?.profiles?.first_name ? `Dr. ${clinic.profiles.first_name} ${clinic.profiles.last_name}` : 'Dental Clinic',
      clinic_address: clinic?.clinic_address || '',
      clinic_phone: clinic?.profiles?.phone || '',
      clinic_email: clinic?.profiles?.email || '',
      clinic_id: clinic?.id || 'default'
    };
  }

  /**
   * Render email template with context data
   */
  private renderTemplate(template: EmailTemplate, event: EmailEvent, context: any) {
    const language = event.payload.language || context.patient_language || 'en';
    
    // Simple template replacement (could use a proper template engine)
    let subject = template.subject;
    let body = template.body;

    const placeholders = {
      ...context,
      ...event.payload,
      patient_name: context.patient_name,
      clinic_name: context.clinic_name,
      clinic_address: context.clinic_address,
      clinic_phone: context.clinic_phone,
      clinic_email: context.clinic_email,
      manage_link: `${window.location.origin}/dashboard?tab=appointments&id=${event.appointment_id}`,
      portal_link: `${window.location.origin}/patient/portal/${event.patient_id}`,
      booking_link: `${window.location.origin}/booking`,
      ics_link: `${window.location.origin}/api/calendar/${event.appointment_id}.ics`
    };

    // Replace placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      body = body.replace(regex, String(value || ''));
    });

    // Handle localization (simplified - would integrate with proper i18n)
    const localizationRegex = /{{t\.([^}]+)}}/g;
    subject = subject.replace(localizationRegex, (match, key) => {
      // Return the key itself for now - would integrate with translation service
      return key.replace(/_/g, ' ');
    });
    body = body.replace(localizationRegex, (match, key) => {
      return key.replace(/_/g, ' ');
    });

    return { subject, body };
  }

  /**
   * Generate email attachments (e.g., .ics calendar files)
   */
  private async generateAttachments(event: EmailEvent, template: EmailTemplate, context: any) {
    const attachments = [];

    if (template.attachments?.includes('appointment.ics') && event.appointment_id) {
      // Generate ICS calendar file
      const icsContent = this.generateIcsContent(event, context);
      attachments.push({
        filename: 'appointment.ics',
        content: icsContent,
        contentType: 'text/calendar'
      });
    }

    return attachments;
  }

  /**
   * Generate ICS calendar file content
   */
  private generateIcsContent(event: EmailEvent, context: any): string {
    const startDate = new Date(event.payload.new_start || event.payload.appointment_start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dental Clinic//Appointment//EN
BEGIN:VEVENT
UID:${event.appointment_id}@${context.clinic_id}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Dental Appointment - ${context.clinic_name}
DESCRIPTION:Dental appointment at ${context.clinic_name}
LOCATION:${context.clinic_address}
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Appointment reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Send email via Supabase edge function
   */
  private async sendTransactionalEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
    metadata: any;
  }) {
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.html,
        messageType: 'system',
        isSystemNotification: true
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Log email event for auditing and idempotency
   */
  private async logEmailEvent(logData: {
    event_type: string;
    patient_id: string;
    appointment_id?: string;
    template_id: string;
    message_id: string;
    idempotency_key: string;
    sent_at: string;
    tenant_id: string;
  }) {
    // Use existing email_notifications table for logging
    await supabase
      .from('email_notifications')
      .insert([{
        patient_id: logData.patient_id,
        dentist_id: logData.tenant_id,
        email_address: '', // Will be filled by the email service
        subject: logData.template_id,
        message_content: logData.idempotency_key, // Store idempotency key here
        message_type: logData.event_type,
        status: 'sent'
      }]);
  }

  /**
   * Trigger email for specific events - public API
   */
  async triggerAppointmentRescheduled(appointmentId: string, oldStart: string, newStart: string, patientId: string) {
    const event: EmailEvent = {
      event: 'AppointmentRescheduled',
      occurred_at: new Date().toISOString(),
      patient_id: patientId,
      appointment_id: appointmentId,
      payload: {
        old_start: oldStart,
        new_start: newStart,
        language: 'en'
      },
      idempotency_key: `evt_${appointmentId}_rescheduled_${Date.now()}`
    };

    return this.processEmailEvent(event);
  }

  async triggerAppointmentCancelled(appointmentId: string, patientId: string, reason: string) {
    const event: EmailEvent = {
      event: 'AppointmentCancelled',
      occurred_at: new Date().toISOString(),
      patient_id: patientId,
      appointment_id: appointmentId,
      payload: {
        cancellation_reason: reason,
        cancelled_by: 'patient',
        language: 'en'
      },
      idempotency_key: `evt_${appointmentId}_cancelled_${Date.now()}`
    };

    return this.processEmailEvent(event);
  }

  async triggerAppointmentReminder(appointmentId: string, patientId: string, reminderType: '24h' | '2h' | '1h') {
    const event: EmailEvent = {
      event: 'AppointmentReminderDue',
      occurred_at: new Date().toISOString(),
      patient_id: patientId,
      appointment_id: appointmentId,
      payload: {
        reminder_type: reminderType,
        language: 'en'
      },
      idempotency_key: `evt_${appointmentId}_reminder_${reminderType}`
    };

    return this.processEmailEvent(event);
  }

  // Add more trigger methods for other events...
}