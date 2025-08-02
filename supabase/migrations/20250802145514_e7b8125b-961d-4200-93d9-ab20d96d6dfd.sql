-- Fix security issues identified by the linter

-- Fix function search path issues by setting search_path
CREATE OR REPLACE FUNCTION get_patient_stats_for_dentist(p_dentist_id uuid, p_patient_id uuid)
RETURNS TABLE (
  total_appointments bigint,
  upcoming_appointments bigint,
  completed_appointments bigint,
  last_appointment_date timestamp with time zone,
  total_notes bigint,
  active_treatment_plans bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search path for upcoming appointments function
CREATE OR REPLACE FUNCTION get_upcoming_appointments_with_urgency(p_dentist_id uuid)
RETURNS TABLE (
  appointment_id uuid,
  patient_id uuid,
  patient_name text,
  appointment_date timestamp with time zone,
  urgency urgency_level,
  reason text,
  pain_level integer,
  has_bleeding boolean,
  has_swelling boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Fix search path for trigger function
CREATE OR REPLACE FUNCTION update_treatment_plan_on_appointment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.update_dentist_ratings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.book_appointment_slot(p_dentist_id uuid, p_slot_date date, p_slot_time time without time zone, p_appointment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(appointment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE appointments 
  SET status = 'cancelled', updated_at = now()
  WHERE id = appointment_id 
  AND patient_id IN (
    SELECT id FROM profiles WHERE profiles.user_id = cancel_appointment.user_id
  );
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_appointment_slot(p_appointment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.appointment_slots 
  SET 
    is_available = true,
    appointment_id = NULL,
    updated_at = now()
  WHERE appointment_id = p_appointment_id;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_slot_time TIME;
  start_time TIME := '07:00';  -- Start earlier
  end_time TIME := '17:00';
  interval_minutes INTEGER := 30;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;