-- Update remaining functions to have proper search_path security
CREATE OR REPLACE FUNCTION public.create_prescription_notification(p_patient_id uuid, p_dentist_id uuid, p_prescription_id uuid, p_medication_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
  patient_user_id UUID;
  dentist_name TEXT;
BEGIN
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the dentist can create prescription notifications';
  END IF;

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
$function$;

-- Fix other critical functions
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

-- Enable realtime for appointments table
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;