-- Drop the old 2-argument function to avoid confusion/ambiguity
DROP FUNCTION IF EXISTS public.generate_daily_slots(uuid, date);

-- Re-create generate_daily_slots with p_business_id parameter
CREATE OR REPLACE FUNCTION public.generate_daily_slots(
  p_dentist_id uuid, 
  p_date date,
  p_business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_time time;
  v_end_time time;
  v_break_start time;
  v_break_end time;
  v_dow int;
  t time;
BEGIN
  -- Use the provided business_id directly
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'Business ID is required';
  END IF;

  -- CRITICAL FIX: Only delete AVAILABLE slots for this specific business. 
  -- Do NOT delete slots that are already booked (is_available = false).
  DELETE FROM public.appointment_slots
   WHERE dentist_id = p_dentist_id
     AND slot_date = p_date
     AND business_id = p_business_id
     AND is_available = true;

  -- Determine day-of-week (0=Sunday..6=Saturday)
  v_dow := EXTRACT(DOW FROM p_date)::int;

  -- Fetch availability for that weekday
  SELECT start_time, end_time, break_start_time, break_end_time
    INTO v_start_time, v_end_time, v_break_start, v_break_end
  FROM public.dentist_availability
  WHERE dentist_id = p_dentist_id
    AND business_id = p_business_id
    AND day_of_week = v_dow
    AND is_available = true
  LIMIT 1;

  -- If no availability, do nothing (no NEW slots on this day)
  IF v_start_time IS NULL OR v_end_time IS NULL THEN
    RETURN;
  END IF;

  -- Generate 30-min slots within availability, excluding break window if present
  t := v_start_time;
  WHILE t < v_end_time LOOP
    IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL AND t >= v_break_start AND t < v_break_end THEN
      t := (t + make_interval(mins => 30));
      CONTINUE;
    END IF;

    -- Try to insert slot. 
    -- ON CONFLICT DO NOTHING ensures we don't overwrite existing slots (including booked ones).
    INSERT INTO public.appointment_slots (business_id, dentist_id, slot_date, slot_time, is_available, emergency_only)
    VALUES (p_business_id, p_dentist_id, p_date, to_char(t, 'HH24:MI'), true, false)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;

    t := (t + make_interval(mins => 30));
  END LOOP;
END;
$function$;
