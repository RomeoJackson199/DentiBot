-- Fix get_dentist_available_slots to correctly filter unavailable slots
CREATE OR REPLACE FUNCTION public.get_dentist_available_slots(
  p_dentist_id uuid,
  p_date date,
  p_business_id uuid
)
RETURNS TABLE (
  slot_time text,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    asl.slot_time::text,
    asl.is_available
  FROM public.appointment_slots asl
  WHERE asl.dentist_id = p_dentist_id
    AND asl.slot_date = p_date
    AND asl.business_id = p_business_id
    AND asl.is_available = true
  ORDER BY asl.slot_time;
END;
$$;

-- Ensure book_appointment_slot is robust
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
    AND (
      slot_time = p_slot_time
      OR slot_time = left(p_slot_time, 5)
    )
    AND is_available = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Slot not available';
  END IF;
END;
$$;
