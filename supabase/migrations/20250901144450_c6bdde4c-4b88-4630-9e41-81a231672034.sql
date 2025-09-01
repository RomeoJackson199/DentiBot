-- Fix database function security by adding proper search_path
CREATE OR REPLACE FUNCTION public.get_upcoming_appointments_with_urgency(p_dentist_id uuid)
 RETURNS TABLE(appointment_id uuid, patient_id uuid, patient_name text, appointment_date timestamp with time zone, urgency urgency_level, reason text, pain_level integer, has_bleeding boolean, has_swelling boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the dentist can view their appointments';
  END IF;

  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    a.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
    a.appointment_date,
    a.urgency,
    a.reason,
    ua.pain_level,
    ua.has_bleeding,
    ua.has_swelling
  FROM appointments a
  JOIN profiles p ON p.id = a.patient_id
  LEFT JOIN urgency_assessments ua ON ua.appointment_id = a.id
  WHERE a.dentist_id = p_dentist_id 
    AND a.appointment_date > now()
    AND a.status != 'cancelled'
  ORDER BY a.appointment_date ASC;
END;
$function$;

-- Fix other database functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_patient_context_for_ai(p_patient_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    JOIN appointments a ON a.dentist_id = d.id
    WHERE a.patient_id = p_patient_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to patient data';
  END IF;
  
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

-- Add proper search_path to all other critical functions
CREATE OR REPLACE FUNCTION public.send_sms_notification(p_patient_id uuid, p_dentist_id uuid, p_phone_number text, p_message_type text, p_message_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  -- Add authorization check - only dentists can send SMS
  IF NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only dentists can send SMS notifications';
  END IF;
  
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