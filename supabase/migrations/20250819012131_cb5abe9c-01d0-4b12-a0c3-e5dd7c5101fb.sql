-- Phase 2: Fix remaining function search path security issues

-- Fix all database functions to have secure search_path
CREATE OR REPLACE FUNCTION public.update_dentist_ratings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.dentists 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    expertise_score = (
      SELECT COALESCE(AVG(expertise_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND expertise_rating IS NOT NULL
    ),
    communication_score = (
      SELECT COALESCE(AVG(communication_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND communication_rating IS NOT NULL
    ),
    wait_time_score = (
      SELECT COALESCE(AVG(wait_time_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND wait_time_rating IS NOT NULL
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.dentist_id, OLD.dentist_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_treatment_plan_on_appointment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- When an appointment is completed, check if we should update treatment plan progress
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update active treatment plans to show progress
    UPDATE treatment_plans 
    SET updated_at = now()
    WHERE patient_id = NEW.patient_id 
      AND dentist_id = NEW.dentist_id 
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_prescription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  PERFORM create_prescription_notification(
    NEW.patient_id,
    NEW.dentist_id,
    NEW.id,
    NEW.medication_name
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_dentist_for_patient(patient_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.send_sms_notification(p_patient_id uuid, p_dentist_id uuid, p_phone_number text, p_message_type text, p_message_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.release_appointment_slot(p_appointment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Authorization is handled at the application level via RLS policies
  UPDATE public.appointment_slots 
  SET 
    is_available = true,
    appointment_id = NULL,
    updated_at = now()
  WHERE appointment_id = p_appointment_id;
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_patient_stats_for_dentist(p_dentist_id uuid, p_patient_id uuid)
 RETURNS TABLE(total_appointments bigint, upcoming_appointments bigint, completed_appointments bigint, last_appointment_date timestamp with time zone, total_notes bigint, active_treatment_plans bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.create_prescription_notification(p_patient_id uuid, p_dentist_id uuid, p_prescription_id uuid, p_medication_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.get_upcoming_appointments_with_urgency(p_dentist_id uuid)
 RETURNS TABLE(appointment_id uuid, patient_id uuid, patient_name text, appointment_date timestamp with time zone, urgency urgency_level, reason text, pain_level integer, has_bleeding boolean, has_swelling boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.book_appointment_slot(p_dentist_id uuid, p_slot_date date, p_slot_time time without time zone, p_appointment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Authorization is handled at the application level via RLS policies
  UPDATE public.appointment_slots 
  SET 
    is_available = false,
    appointment_id = p_appointment_id,
    updated_at = now()
  WHERE 
    dentist_id = p_dentist_id 
    AND slot_date = p_slot_date 
    AND slot_time = p_slot_time
    AND is_available = true;
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(appointment_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE appointments 
  SET status = 'cancelled', updated_at = now()
  WHERE id = appointment_id 
  AND patient_id IN (
    SELECT id FROM profiles WHERE profiles.user_id = cancel_appointment.user_id
  );
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_slot_time TIME;
  start_time TIME := '07:00';  -- Start earlier
  end_time TIME := '17:00';
  interval_minutes INTEGER := 30;
BEGIN
  -- Authorization is handled at the application level
  -- Generate slots from 7:00 AM to 5:00 PM (every 30 minutes)
  current_slot_time := start_time;
  
  WHILE current_slot_time < end_time LOOP
    INSERT INTO public.appointment_slots (dentist_id, slot_date, slot_time, emergency_only)
    VALUES (
      p_dentist_id, 
      p_date, 
      current_slot_time,
      CASE WHEN current_slot_time >= '11:30:00' THEN true ELSE false END
    )
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;
    
    -- Add 30 minutes to the current slot time
    current_slot_time := current_slot_time + (interval_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert profile first with explicit schema reference
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::public.user_role
  );

  -- If the user is a dentist, create a dentist entry
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'dentist' THEN
    INSERT INTO public.dentists (profile_id, is_active)
    SELECT id, true 
    FROM public.profiles 
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;