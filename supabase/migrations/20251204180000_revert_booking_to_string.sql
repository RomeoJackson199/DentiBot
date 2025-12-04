-- Revert book_appointment_slot to use explicit string matching
-- The timestamp approach caused a 1-hour offset due to timezone conversion issues.
-- Using the explicit "HH:mm" string from the frontend is safer and unambiguous.

DROP FUNCTION IF EXISTS public.book_appointment_slot(uuid, date, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.book_appointment_slot(uuid, date, text, uuid);

CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_dentist_id uuid,
  p_slot_date date,
  p_slot_time text,
  p_appointment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  -- Strict update: Cast input text to TIME and match exactly.
  -- We trust the frontend to send the correct "HH:mm" string that the user selected.
  UPDATE public.appointment_slots
  SET is_available = false,
      appointment_id = p_appointment_id,
      updated_at = now()
  WHERE dentist_id = p_dentist_id
    AND slot_date = p_slot_date
    AND slot_time = p_slot_time::time
    AND is_available = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Slot not available (Time: %)', p_slot_time;
  END IF;
END;
$$;
