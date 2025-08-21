-- Fix Function Security - Add explicit search_path to all security definer functions
-- This prevents potential schema-based attacks

-- Update all security definer functions that are missing explicit search_path
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

CREATE OR REPLACE FUNCTION public.get_dashboard_overview(p_dentist_id uuid)
 RETURNS TABLE(today_appointments_count bigint, urgent_cases_count bigint, patients_waiting_count bigint, patients_in_treatment_count bigint, revenue_today numeric, pending_tasks_count bigint, unread_messages_count bigint)
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
    RAISE EXCEPTION 'Unauthorized: Only the dentist can view their dashboard';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND DATE(appointment_date) = CURRENT_DATE 
     AND status != 'cancelled') as today_appointments_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND urgency = 'high' 
     AND appointment_date >= now() 
     AND status != 'cancelled') as urgent_cases_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'checked_in' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_waiting_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'in_treatment' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_in_treatment_count,
    
    (SELECT COALESCE(SUM(
      CASE 
        WHEN urgency = 'high' THEN 200
        WHEN urgency = 'medium' THEN 150
        ELSE 100
      END
    ), 0) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND DATE(appointment_date) = CURRENT_DATE 
     AND status = 'completed') as revenue_today,
    
    (SELECT COUNT(*) FROM dentist_tasks 
     WHERE dentist_id = p_dentist_id 
     AND status = 'open') as pending_tasks_count,
    
    (SELECT COUNT(*) FROM communications 
     WHERE dentist_id = p_dentist_id 
     AND status = 'unread') as unread_messages_count;
END;
$function$;

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