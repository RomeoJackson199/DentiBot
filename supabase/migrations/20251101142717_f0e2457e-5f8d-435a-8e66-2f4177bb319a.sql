-- Secure RPC to atomically reschedule an appointment for the owning user
-- Allows patients to reschedule their own appointment despite RLS on appointments UPDATE
CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_appointment_id uuid,
  p_user_id uuid,
  p_slot_date date,
  p_slot_time text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_patient_id uuid;
  v_dentist_id uuid;
BEGIN
  -- Authorize: ensure the caller owns this appointment via profiles.user_id
  SELECT a.patient_id, a.dentist_id
    INTO v_patient_id, v_dentist_id
  FROM public.appointments a
  JOIN public.profiles p ON p.id = a.patient_id
  WHERE a.id = p_appointment_id
    AND p.user_id = p_user_id
  FOR UPDATE;  -- lock the appointment row

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Release any previously held slot for this appointment
  UPDATE public.appointment_slots
     SET is_available = true,
         appointment_id = NULL,
         updated_at = now()
   WHERE appointment_id = p_appointment_id;

  -- Ensure target slot exists and is available, lock it to avoid race
  PERFORM 1
    FROM public.appointment_slots
   WHERE dentist_id = v_dentist_id
     AND slot_date = p_slot_date
     AND slot_time = p_slot_time
     AND is_available = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Reserve the new slot for this appointment
  UPDATE public.appointment_slots
     SET is_available = false,
         appointment_id = p_appointment_id,
         updated_at = now()
   WHERE dentist_id = v_dentist_id
     AND slot_date = p_slot_date
     AND slot_time = p_slot_time;

  -- Update appointment datetime and status
  UPDATE public.appointments
     SET appointment_date = (p_slot_date::timestamp AT TIME ZONE 'UTC') + (p_slot_time::time - time '00:00'),
         status = 'confirmed',
         updated_at = now()
   WHERE id = p_appointment_id;

  RETURN true;
END;
$$;