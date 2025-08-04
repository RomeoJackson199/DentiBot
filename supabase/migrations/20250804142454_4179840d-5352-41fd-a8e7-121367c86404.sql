-- CRITICAL SECURITY FIXES
-- Fix 1: Enable RLS policies for medical_records table (CRITICAL - currently all medical records are public)

-- Enable RLS for medical_records if not already enabled
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Add policies for medical_records
CREATE POLICY "Patients can view their own medical records" 
ON public.medical_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = medical_records.patient_id
  )
);

CREATE POLICY "Patients can create their own medical records" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = medical_records.patient_id
  )
);

CREATE POLICY "Patients can update their own medical records" 
ON public.medical_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = medical_records.patient_id
  )
);

CREATE POLICY "Dentists can view their patients' medical records" 
ON public.medical_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND d.id = medical_records.dentist_id
  )
);

CREATE POLICY "Dentists can create medical records for their patients" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND d.id = medical_records.dentist_id
  )
);

CREATE POLICY "Dentists can update medical records for their patients" 
ON public.medical_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND d.id = medical_records.dentist_id
  )
);

-- Fix 2: Add RLS policies for consents table (CRITICAL - has RLS enabled but no policies)

CREATE POLICY "Users can view their own consent records" 
ON public.consents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = consents.patient_id
  )
);

CREATE POLICY "Users can create consent records" 
ON public.consents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = consents.patient_id
  )
);

CREATE POLICY "Users can update their own consent records" 
ON public.consents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = consents.patient_id
  )
);

-- Fix 3: Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_patient_context_for_ai(p_patient_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
  ORDER BY record_date DESC
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
$function$;

-- Fix 4: Update other security definer functions
CREATE OR REPLACE FUNCTION public.send_sms_notification(p_patient_id uuid, p_dentist_id uuid, p_phone_number text, p_message_type text, p_message_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO sms_notifications (
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
$function$;

CREATE OR REPLACE FUNCTION public.get_patient_stats_for_dentist(p_dentist_id uuid, p_patient_id uuid)
 RETURNS TABLE(total_appointments bigint, upcoming_appointments bigint, completed_appointments bigint, last_appointment_date timestamp with time zone, total_notes bigint, active_treatment_plans bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM appointments 
     WHERE patient_id = p_patient_id AND dentist_id = p_dentist_id) as total_appointments,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE patient_id = p_patient_id AND dentist_id = p_dentist_id 
     AND appointment_date > now() AND status != 'cancelled') as upcoming_appointments,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE patient_id = p_patient_id AND dentist_id = p_dentist_id 
     AND status = 'completed') as completed_appointments,
    
    (SELECT MAX(appointment_date) FROM appointments 
     WHERE patient_id = p_patient_id AND dentist_id = p_dentist_id 
     AND status = 'completed') as last_appointment_date,
    
    (SELECT COUNT(*) FROM notes 
     WHERE patient_id = p_patient_id) as total_notes,
    
    (SELECT COUNT(*) FROM treatment_plans 
     WHERE patient_id = p_patient_id AND dentist_id = p_dentist_id 
     AND status = 'active') as active_treatment_plans;
END;
$function$;