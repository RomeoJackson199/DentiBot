-- Fix book_appointment_slot to run as SECURITY DEFINER
-- This allows the function to update slots without being blocked by patient RLS policies

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
  UPDATE public.appointment_slots
  SET is_available = false,
      appointment_id = p_appointment_id,
      updated_at = now()
  WHERE dentist_id = p_dentist_id
    AND slot_date = p_slot_date
    AND slot_time = p_slot_time
    AND is_available = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Slot not available';
  END IF;
END;
$$;
