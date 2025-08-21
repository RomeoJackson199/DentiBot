export interface EmailEvent {
  event: string;
  occurred_at: string;
  patient_id: string;
  appointment_id?: string;
  treatment_plan_id?: string;
  invoice_id?: string;
  payload: Record<string, any>;
  idempotency_key: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  localization_keys: string[];
  attachments?: string[];
  priority: 'essential' | 'important' | 'normal';
}

export const EMAIL_TEMPLATES = {
  AppointmentRescheduled: {
    subject: "{{t.appointment_rescheduled_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.appointment_rescheduled_message}}

{{t.new_details}}:
{{t.date}}: {{new_appointment_date}}
{{t.time}}: {{new_appointment_time}}
{{t.location}}: {{clinic_address}}

{{t.need_changes}} {{manage_link}}
{{t.add_calendar}}: {{ics_link}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "appointment_rescheduled_subject",
      "greeting",
      "appointment_rescheduled_message",
      "new_details",
      "date",
      "time", 
      "location",
      "need_changes",
      "add_calendar",
      "closing",
      "team_signature"
    ],
    attachments: ["appointment.ics"],
    priority: "essential" as const
  },

  AppointmentCancelled: {
    subject: "{{t.appointment_cancelled_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.appointment_cancelled_message}} {{original_appointment_date}} {{t.at}} {{original_appointment_time}}.

{{t.book_new_appointment}}: {{booking_link}}

{{t.questions_contact}}: {{clinic_phone}} {{t.or}} {{clinic_email}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "appointment_cancelled_subject",
      "greeting",
      "appointment_cancelled_message",
      "at",
      "book_new_appointment",
      "questions_contact",
      "or",
      "closing",
      "team_signature"
    ],
    priority: "essential" as const
  },

  AppointmentReminderDue: {
    subject: "{{t.reminder_subject}} {{clinic_name}} - {{appointment_date}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.reminder_message}}:

{{t.date}}: {{appointment_date}}
{{t.time}}: {{appointment_time}}
{{t.location}}: {{clinic_address}}
{{t.dentist}}: {{dentist_name}}

{{t.preparation_notes}}

{{t.need_reschedule}}: {{manage_link}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "reminder_subject",
      "greeting", 
      "reminder_message",
      "date",
      "time",
      "location",
      "dentist",
      "preparation_notes",
      "need_reschedule",
      "closing",
      "team_signature"
    ],
    priority: "important" as const
  },

  AppointmentCompleted: {
    subject: "{{t.treatment_complete_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.treatment_complete_message}} {{appointment_date}}.

{{t.view_summary}}: {{portal_link}}

{{t.next_steps}}:
- {{t.follow_instructions}}
- {{t.schedule_followup}}

{{t.questions_contact}}: {{clinic_phone}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "treatment_complete_subject",
      "greeting",
      "treatment_complete_message", 
      "view_summary",
      "next_steps",
      "follow_instructions",
      "schedule_followup",
      "questions_contact",
      "closing",
      "team_signature"
    ],
    priority: "important" as const
  },

  TreatmentPlanAccepted: {
    subject: "{{t.treatment_plan_accepted_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.treatment_plan_accepted_message}}.

{{t.next_steps}}:
- {{t.scheduling_contact}}
- {{t.pre_treatment_prep}}

{{t.view_plan}}: {{portal_link}}

{{t.questions}} {{clinic_phone}} {{t.or}} {{clinic_email}}.

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "treatment_plan_accepted_subject",
      "greeting",
      "treatment_plan_accepted_message",
      "next_steps", 
      "scheduling_contact",
      "pre_treatment_prep",
      "view_plan",
      "questions",
      "or",
      "closing",
      "team_signature"
    ],
    priority: "important" as const
  },

  InvoicePaid: {
    subject: "{{t.payment_received_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.payment_received_message}} {{payment_amount}}.

{{t.payment_details}}:
{{t.invoice_number}}: {{invoice_number}}
{{t.payment_date}}: {{payment_date}}
{{t.payment_method}}: {{payment_method}}

{{t.download_receipt}}: {{receipt_link}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "payment_received_subject",
      "greeting",
      "payment_received_message",
      "payment_details",
      "invoice_number",
      "payment_date", 
      "payment_method",
      "download_receipt",
      "closing",
      "team_signature"
    ],
    priority: "essential" as const
  },

  InvoicePaymentFailed: {
    subject: "{{t.payment_failed_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.payment_failed_message}} {{invoice_number}}.

{{t.retry_payment}}: {{payment_link}}

{{t.payment_methods}}:
- {{t.online_payment}}
- {{t.phone_payment}} {{clinic_phone}}

{{t.contact_support}}: {{clinic_email}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "payment_failed_subject",
      "greeting",
      "payment_failed_message",
      "retry_payment",
      "payment_methods",
      "online_payment",
      "phone_payment",
      "contact_support", 
      "closing",
      "team_signature"
    ],
    priority: "essential" as const
  },

  RefundIssued: {
    subject: "{{t.refund_processed_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.refund_processed_message}} {{refund_amount}}.

{{t.refund_details}}:
{{t.original_payment}}: {{original_amount}}
{{t.refund_amount_label}}: {{refund_amount}}
{{t.refund_method}}: {{refund_method}}
{{t.processing_time}}: {{processing_days}}

{{t.questions}} {{clinic_email}}.

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "refund_processed_subject",
      "greeting",
      "refund_processed_message",
      "refund_details",
      "original_payment",
      "refund_amount_label",
      "refund_method",
      "processing_time",
      "questions",
      "closing",
      "team_signature"
    ],
    priority: "essential" as const
  },

  NoShowRecorded: {
    subject: "{{t.missed_appointment_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.missed_appointment_message}} {{appointment_date}} {{t.at}} {{appointment_time}}.

{{t.reschedule_message}}: {{booking_link}}

{{t.policy_reminder}}:
{{t.cancellation_policy}}

{{t.questions}} {{clinic_phone}}.

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "missed_appointment_subject",
      "greeting", 
      "missed_appointment_message",
      "at",
      "reschedule_message",
      "policy_reminder",
      "cancellation_policy",
      "questions",
      "closing",
      "team_signature"
    ],
    priority: "normal" as const
  },

  RecallDue: {
    subject: "{{t.recall_due_subject}} - {{clinic_name}}",
    body: `{{t.greeting}} {{patient_name}},

{{t.recall_due_message}} {{recall_type}}.

{{t.recommended_treatments}}:
{{treatment_list}}

{{t.book_appointment}}: {{booking_link}}
{{t.call_to_book}}: {{clinic_phone}}

{{t.oral_health_importance}}

{{t.closing}},
— {{t.team_signature}} {{clinic_name}}`,
    localization_keys: [
      "recall_due_subject",
      "greeting",
      "recall_due_message", 
      "recommended_treatments",
      "book_appointment",
      "call_to_book",
      "oral_health_importance",
      "closing",
      "team_signature"
    ],
    priority: "normal" as const
  }
};

export const EVENT_SCHEMAS = {
  AppointmentRescheduled: {
    event: "AppointmentRescheduled",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    appointment_id: "string", 
    payload: {
      old_start: "ISO_8601_TIMESTAMP",
      new_start: "ISO_8601_TIMESTAMP",
      location: "string",
      dentist_name: "string",
      language: "string",
      reason: "string"
    },
    idempotency_key: "evt_{appointment_id}_rescheduled_{timestamp}"
  },

  AppointmentCancelled: {
    event: "AppointmentCancelled",
    occurred_at: "ISO_8601_TIMESTAMP", 
    patient_id: "string",
    appointment_id: "string",
    payload: {
      cancelled_start: "ISO_8601_TIMESTAMP",
      cancellation_reason: "string",
      cancelled_by: "patient|dentist|system",
      language: "string"
    },
    idempotency_key: "evt_{appointment_id}_cancelled_{timestamp}"
  },

  AppointmentReminderDue: {
    event: "AppointmentReminderDue",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string", 
    appointment_id: "string",
    payload: {
      appointment_start: "ISO_8601_TIMESTAMP",
      dentist_name: "string",
      location: "string",
      reminder_type: "24h|2h|1h",
      preparation_notes: "string",
      language: "string"
    },
    idempotency_key: "evt_{appointment_id}_reminder_{reminder_type}"
  },

  AppointmentCompleted: {
    event: "AppointmentCompleted",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    appointment_id: "string",
    payload: {
      completion_time: "ISO_8601_TIMESTAMP",
      treatments_performed: "string[]",
      follow_up_required: "boolean",
      next_appointment_recommended: "string",
      language: "string"
    },
    idempotency_key: "evt_{appointment_id}_completed"
  },

  TreatmentPlanAccepted: {
    event: "TreatmentPlanAccepted",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    treatment_plan_id: "string",
    payload: {
      plan_name: "string", 
      estimated_duration: "string",
      estimated_cost: "number",
      acceptance_method: "digital|verbal|written",
      language: "string"
    },
    idempotency_key: "evt_{treatment_plan_id}_accepted"
  },

  InvoicePaid: {
    event: "InvoicePaid",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    invoice_id: "string",
    payload: {
      amount_paid: "number",
      payment_method: "string",
      transaction_id: "string",
      currency: "string",
      language: "string"
    },
    idempotency_key: "evt_{invoice_id}_paid_{transaction_id}"
  },

  InvoicePaymentFailed: {
    event: "InvoicePaymentFailed", 
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    invoice_id: "string",
    payload: {
      amount_attempted: "number",
      failure_reason: "string",
      retry_count: "number",
      currency: "string",
      language: "string"
    },
    idempotency_key: "evt_{invoice_id}_failed_{timestamp}"
  },

  RefundIssued: {
    event: "RefundIssued",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string",
    invoice_id: "string",
    payload: {
      refund_amount: "number",
      original_amount: "number",
      refund_reason: "string",
      processing_days: "number",
      currency: "string",
      language: "string"
    },
    idempotency_key: "evt_{invoice_id}_refund_{timestamp}"
  },

  NoShowRecorded: {
    event: "NoShowRecorded",
    occurred_at: "ISO_8601_TIMESTAMP", 
    patient_id: "string",
    appointment_id: "string",
    payload: {
      scheduled_time: "ISO_8601_TIMESTAMP",
      no_show_fee: "number",
      policy_applied: "boolean",
      language: "string"
    },
    idempotency_key: "evt_{appointment_id}_noshow"
  },

  RecallDue: {
    event: "RecallDue",
    occurred_at: "ISO_8601_TIMESTAMP",
    patient_id: "string", 
    payload: {
      recall_type: "cleaning|checkup|follow_up",
      last_visit_date: "ISO_8601_TIMESTAMP",
      recommended_treatments: "string[]",
      overdue_days: "number",
      language: "string"
    },
    idempotency_key: "evt_{patient_id}_recall_{recall_type}"
  }
};

// Rate limiting configuration
export const RATE_LIMITS = {
  essential: null, // No limits on essential emails
  important: 5, // Max 5 per day
  normal: 3 // Max 3 per day
};

// Localization support - example for English
export const LOCALIZATIONS = {
  en: {
    appointment_rescheduled_subject: "Your appointment has been rescheduled",
    appointment_cancelled_subject: "Your appointment has been cancelled", 
    reminder_subject: "Reminder: Your appointment at",
    treatment_complete_subject: "Your treatment is complete",
    treatment_plan_accepted_subject: "Treatment plan confirmed",
    payment_received_subject: "Payment received - Thank you",
    payment_failed_subject: "Payment failed - Action required",
    refund_processed_subject: "Refund processed",
    missed_appointment_subject: "Missed appointment",
    recall_due_subject: "Time for your dental checkup",
    greeting: "Hi",
    closing: "We look forward to seeing you",
    team_signature: "The",
    // ... add more translations
  },
  // Add fr, nl, de translations...
};