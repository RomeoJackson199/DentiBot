-- Fix book_appointment_slot to use appointment timestamp for accurate slot matching
-- This avoids issues where the frontend string might not match the DB expectation due to timezone confusion.

DROP FUNCTION IF EXISTS public.book_appointment_slot(uuid, date, text, uuid);

CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_dentist_id uuid,
  p_slot_date date,
  p_appointment_timestamp timestamptz,
  p_appointment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
  v_target_time TIME;
BEGIN
  -- Calculate the target slot time by converting the UTC timestamp to Clinic Time (Brussels)
  -- This ensures we book the slot that corresponds to the actual appointment time.
  v_target_time := (p_appointment_timestamp AT TIME ZONE 'Europe/Brussels')::time;

  UPDATE public.appointment_slots
  SET is_available = false,
      appointment_id = p_appointment_id,
      updated_at = now()
  WHERE dentist_id = p_dentist_id
    AND slot_date = p_slot_date
    AND slot_time = v_target_time
    AND is_available = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    RETURN true;
  ELSE
    -- If no row updated, it means the slot is either taken or doesn't exist.
    RAISE EXCEPTION 'Slot not available (Target time: %)', v_target_time;
  END IF;
END;
$$;
