-- Fix function search path security issue
-- Update all functions to have proper search_path set

-- Fix get_patient_context_for_ai function
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

-- Fix other functions with search_path
CREATE OR REPLACE FUNCTION public.is_dentist_for_patient(patient_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles dentist_profile ON dentist_profile.id = d.profile_id
    WHERE a.patient_id = patient_profile_id 
    AND dentist_profile.user_id = auth.uid()
  );
$function$;

-- Add database indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient_date 
ON appointments(patient_id, appointment_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_dentist_date 
ON appointments(dentist_id, appointment_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_patient_date 
ON medical_records(patient_id, record_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_notes_patient_created 
ON patient_notes(patient_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_patient_date 
ON prescriptions(patient_id, prescribed_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_patient_status 
ON treatment_plans(patient_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dentists_profile_active 
ON dentists(profile_id, is_active);

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_composite 
ON appointments(patient_id, status, appointment_date DESC) 
WHERE status IN ('confirmed', 'pending', 'completed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Optimize chat messages table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_created 
ON chat_messages(session_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user_created 
ON chat_messages(user_id, created_at DESC);