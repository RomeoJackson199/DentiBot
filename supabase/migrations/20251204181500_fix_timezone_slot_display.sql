-- Fix: Generate slots on-the-fly and properly filter by Brussels timezone
-- This fixes the "hides one hour before" bug by correctly handling timezone conversion

DROP FUNCTION IF EXISTS public.get_dentist_available_slots(uuid, date, uuid);

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
DECLARE
  v_day_of_week int;
  v_start_time time;
  v_end_time time;
  v_slot time;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get dentist's working hours for this day
  SELECT da.start_time, da.end_time INTO v_start_time, v_end_time
  FROM dentist_availability da
  WHERE da.dentist_id = p_dentist_id
    AND da.day_of_week = v_day_of_week
    AND da.is_available = true
  LIMIT 1;
  
  -- If no availability found, return empty
  IF v_start_time IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate 30-minute slots and check against appointments
  v_slot := v_start_time;
  WHILE v_slot < v_end_time LOOP
    -- Check if this slot is NOT booked (using Brussels timezone for comparison)
    IF NOT EXISTS (
      SELECT 1 FROM appointments apt
      WHERE apt.dentist_id = p_dentist_id
        AND apt.status NOT IN ('cancelled')
        AND apt.appointment_date::date = p_date
        AND to_char(apt.appointment_date AT TIME ZONE 'Europe/Brussels', 'HH24:MI') = to_char(v_slot, 'HH24:MI')
    ) THEN
      -- Return this slot as available
      RETURN QUERY SELECT to_char(v_slot, 'HH24:MI')::text, true::boolean;
    END IF;
    
    v_slot := v_slot + interval '30 minutes';
  END LOOP;
END;
$$;
