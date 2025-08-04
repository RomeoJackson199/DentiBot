-- Create notifications table for system notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID,
  dentist_id UUID,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'prescription', 'appointment', 'treatment'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to create prescription notification
CREATE OR REPLACE FUNCTION public.create_prescription_notification(
  p_patient_id UUID,
  p_dentist_id UUID,
  p_prescription_id UUID,
  p_medication_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
  patient_user_id UUID;
  dentist_name TEXT;
BEGIN
  -- Get patient user_id
  SELECT user_id INTO patient_user_id
  FROM profiles WHERE id = p_patient_id;
  
  -- Get dentist name
  SELECT CONCAT(first_name, ' ', last_name) INTO dentist_name
  FROM profiles p
  JOIN dentists d ON d.profile_id = p.id
  WHERE d.id = p_dentist_id;
  
  -- Create notification for patient
  INSERT INTO notifications (
    user_id,
    patient_id,
    dentist_id,
    type,
    title,
    message,
    priority,
    action_url,
    action_label,
    metadata
  ) VALUES (
    patient_user_id,
    p_patient_id,
    p_dentist_id,
    'prescription',
    'New Prescription Available',
    'Dr. ' || dentist_name || ' has prescribed ' || p_medication_name || ' for you.',
    'high',
    '/dashboard?tab=health',
    'View Prescription',
    jsonb_build_object('prescription_id', p_prescription_id, 'medication_name', p_medication_name)
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create trigger to auto-create notifications for new prescriptions
CREATE OR REPLACE FUNCTION public.notify_new_prescription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM create_prescription_notification(
    NEW.patient_id,
    NEW.dentist_id,
    NEW.id,
    NEW.medication_name
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_prescription_created
  AFTER INSERT ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_prescription();

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();