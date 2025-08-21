-- Create email event logs table for tracking sent emails and idempotency
CREATE TABLE public.email_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  treatment_plan_id UUID,
  invoice_id UUID,
  template_id TEXT NOT NULL,
  message_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('essential', 'important', 'normal')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'fr', 'nl', 'de'));

-- Create indexes for performance
CREATE INDEX idx_email_event_logs_patient_id ON public.email_event_logs(patient_id);
CREATE INDEX idx_email_event_logs_sent_at ON public.email_event_logs(sent_at);
CREATE INDEX idx_email_event_logs_idempotency ON public.email_event_logs(idempotency_key);
CREATE INDEX idx_email_event_logs_priority_sent_at ON public.email_event_logs(priority, sent_at);

-- Enable RLS
ALTER TABLE public.email_event_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email event logs
CREATE POLICY "Dentists can view their patients' email logs" 
ON public.email_event_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE a.patient_id = email_event_logs.patient_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "System can create email logs" 
ON public.email_event_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Patients can view their own email logs" 
ON public.email_event_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = email_event_logs.patient_id 
    AND p.user_id = auth.uid()
  )
);