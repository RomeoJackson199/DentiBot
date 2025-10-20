-- Ensure daily slots RPC to auto-generate slots on demand
CREATE OR REPLACE FUNCTION public.ensure_daily_slots(p_dentist_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.appointment_slots
    WHERE dentist_id = p_dentist_id AND slot_date = p_date
  ) INTO v_exists;

  IF NOT v_exists THEN
    PERFORM public.generate_daily_slots(p_dentist_id, p_date);
  END IF;
END;
$$;

-- Helpful index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointment_slots_dentist_date
ON public.appointment_slots (dentist_id, slot_date);