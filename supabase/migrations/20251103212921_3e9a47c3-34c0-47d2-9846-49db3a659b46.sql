-- Prefer current business context first in slot generation, then fallback
CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_id uuid;
  v_start_time time;
  v_end_time time;
  v_break_start time;
  v_break_end time;
  v_dow int;
  t time;
BEGIN
  -- Prefer current session business first
  v_business_id := public.get_current_business_id();

  -- Fallback to first mapped business for the dentist
  IF v_business_id IS NULL THEN
    SELECT pb.business_id INTO v_business_id
    FROM public.provider_business_map pb
    JOIN public.dentists d ON d.profile_id = pb.provider_id
    WHERE d.id = p_dentist_id
    LIMIT 1;
  END IF;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'No business context found for dentist %', p_dentist_id;
  END IF;

  -- Clean up any existing slots for this dentist/date/business to avoid stale data
  DELETE FROM public.appointment_slots
   WHERE dentist_id = p_dentist_id
     AND slot_date = p_date
     AND business_id = v_business_id;

  -- Determine day-of-week (0=Sunday..6=Saturday)
  v_dow := EXTRACT(DOW FROM p_date)::int;

  -- Fetch availability for that weekday
  SELECT start_time, end_time, break_start_time, break_end_time
    INTO v_start_time, v_end_time, v_break_start, v_break_end
  FROM public.dentist_availability
  WHERE dentist_id = p_dentist_id
    AND business_id = v_business_id
    AND day_of_week = v_dow
    AND is_available = true
  LIMIT 1;

  -- If no availability, do nothing (no slots on this day)
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

    INSERT INTO public.appointment_slots (business_id, dentist_id, slot_date, slot_time, is_available, emergency_only)
    VALUES (v_business_id, p_dentist_id, p_date, to_char(t, 'HH24:MI'), true, false)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;

    t := (t + make_interval(mins => 30));
  END LOOP;
END;
$function$;

-- One-time cleanup: remove slots on days marked as closed in schedule
DELETE FROM public.appointment_slots s
USING public.dentist_availability a
WHERE s.dentist_id = a.dentist_id
  AND s.business_id = a.business_id
  AND EXTRACT(DOW FROM s.slot_date)::int = a.day_of_week
  AND a.is_available = false;