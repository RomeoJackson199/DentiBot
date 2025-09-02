-- Fix remaining functions that need proper search_path
CREATE OR REPLACE FUNCTION public.create_simple_appointment(p_patient_id uuid, p_dentist_id uuid, p_appointment_date timestamp with time zone, p_reason text DEFAULT 'Consultation'::text, p_urgency urgency_level DEFAULT 'medium'::urgency_level)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_appointment_id UUID;
  patient_name TEXT;
BEGIN
  -- Add authorization check - user must be the patient or the dentist
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only create appointments for yourself or your patients';
  END IF;
  
  -- Get patient name
  SELECT first_name || ' ' || last_name INTO patient_name
  FROM profiles WHERE id = p_patient_id;
  
  -- Insert appointment
  INSERT INTO appointments (
    patient_id,
    dentist_id,
    appointment_date,
    reason,
    urgency,
    status,
    patient_name,
    duration_minutes
  ) VALUES (
    p_patient_id,
    p_dentist_id,
    p_appointment_date,
    p_reason,
    p_urgency,
    'confirmed'::appointment_status,
    patient_name,
    60
  ) RETURNING id INTO new_appointment_id;
  
  RETURN new_appointment_id;
END;
$function$;

-- Fix other functions
CREATE OR REPLACE FUNCTION public.get_patient_stats_for_dentist(p_dentist_id uuid, p_patient_id uuid)
 RETURNS TABLE(total_appointments bigint, upcoming_appointments bigint, completed_appointments bigint, last_appointment_date timestamp with time zone, total_notes bigint, active_treatment_plans bigint)
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
    RAISE EXCEPTION 'Unauthorized: Only the dentist can view patient stats';
  END IF;

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

-- Fix update import session progress function
CREATE OR REPLACE FUNCTION public.update_import_session_progress(p_session_id uuid, p_successful integer DEFAULT 0, p_failed integer DEFAULT 0, p_status text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM import_sessions iss
    JOIN dentists d ON d.id = iss.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE iss.id = p_session_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the dentist can update their import sessions';
  END IF;

  UPDATE import_sessions 
  SET 
    successful_records = successful_records + p_successful,
    failed_records = failed_records + p_failed,
    status = COALESCE(p_status, status),
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_session_id;
END;
$function$;