-- Add Twilio support and additional features

-- Add vacation/sick days table for dentists
CREATE TABLE IF NOT EXISTS public.dentist_vacation_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  vacation_type TEXT NOT NULL DEFAULT 'vacation', -- 'vacation', 'sick', 'personal'
  reason TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add symptom summaries table for better AI context
CREATE TABLE IF NOT EXISTS public.patient_symptom_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  summary_text TEXT NOT NULL,
  extracted_symptoms JSONB,
  pain_level INTEGER,
  urgency_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add SMS/Twilio notifications table
CREATE TABLE IF NOT EXISTS public.sms_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'auth', 'appointment_confirmation', 'reminder', 'emergency'
  message_content TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.dentist_vacation_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_symptom_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dentist_vacation_days
CREATE POLICY "Dentists can manage their own vacation days" 
ON public.dentist_vacation_days 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = dentist_vacation_days.dentist_id 
  AND p.user_id = auth.uid()
));

-- RLS Policies for patient_symptom_summaries
CREATE POLICY "Dentists can view symptom summaries" 
ON public.patient_symptom_summaries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM appointments a
  JOIN dentists d ON d.id = a.dentist_id
  JOIN profiles p ON p.id = d.profile_id
  WHERE a.patient_id = patient_symptom_summaries.patient_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Patients can view their own symptom summaries" 
ON public.patient_symptom_summaries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = patient_symptom_summaries.patient_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "System can create symptom summaries" 
ON public.patient_symptom_summaries 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for sms_notifications
CREATE POLICY "Dentists can view their SMS notifications" 
ON public.sms_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = sms_notifications.dentist_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Patients can view their SMS notifications" 
ON public.sms_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = sms_notifications.patient_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "System can manage SMS notifications" 
ON public.sms_notifications 
FOR ALL 
USING (true);

-- Update updated_at triggers
CREATE TRIGGER update_dentist_vacation_days_updated_at
BEFORE UPDATE ON public.dentist_vacation_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_symptom_summaries_updated_at
BEFORE UPDATE ON public.patient_symptom_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get enhanced patient context for AI
CREATE OR REPLACE FUNCTION public.get_patient_context_for_ai(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB := '{}';
  patient_info JSONB;
  appointments_info JSONB;
  medical_records_info JSONB;
  notes_info JSONB;
  symptom_summaries_info JSONB;
  treatment_plans_info JSONB;
BEGIN
  -- Get patient profile
  SELECT to_jsonb(profiles) INTO patient_info
  FROM profiles
  WHERE id = p_patient_id;
  
  -- Get recent appointments
  SELECT jsonb_agg(to_jsonb(appointments)) INTO appointments_info
  FROM appointments
  WHERE patient_id = p_patient_id
  ORDER BY appointment_date DESC
  LIMIT 10;
  
  -- Get medical records
  SELECT jsonb_agg(to_jsonb(medical_records)) INTO medical_records_info
  FROM medical_records
  WHERE patient_id = p_patient_id
  ORDER BY visit_date DESC
  LIMIT 5;
  
  -- Get notes
  SELECT jsonb_agg(to_jsonb(notes)) INTO notes_info
  FROM notes
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 10;
  
  -- Get symptom summaries
  SELECT jsonb_agg(to_jsonb(patient_symptom_summaries)) INTO symptom_summaries_info
  FROM patient_symptom_summaries
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 5;
  
  -- Get treatment plans
  SELECT jsonb_agg(to_jsonb(treatment_plans)) INTO treatment_plans_info
  FROM treatment_plans
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 5;
  
  -- Build result
  result := jsonb_build_object(
    'patient', patient_info,
    'appointments', COALESCE(appointments_info, '[]'::jsonb),
    'medical_records', COALESCE(medical_records_info, '[]'::jsonb),
    'notes', COALESCE(notes_info, '[]'::jsonb),
    'symptom_summaries', COALESCE(symptom_summaries_info, '[]'::jsonb),
    'treatment_plans', COALESCE(treatment_plans_info, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Function to send SMS notification
CREATE OR REPLACE FUNCTION public.send_sms_notification(
  p_patient_id UUID,
  p_dentist_id UUID,
  p_phone_number TEXT,
  p_message_type TEXT,
  p_message_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.sms_notifications (
    patient_id,
    dentist_id,
    phone_number,
    message_type,
    message_content,
    status
  ) VALUES (
    p_patient_id,
    p_dentist_id,
    p_phone_number,
    p_message_type,
    p_message_content,
    'pending'
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;