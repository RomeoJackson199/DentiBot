-- Make appointment slot generation business-aware and valid with NOT NULL business_id
DROP FUNCTION IF EXISTS public.generate_daily_slots(uuid, date);

CREATE OR REPLACE FUNCTION public.generate_daily_slots(
  p_dentist_id uuid,
  p_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIME := TIME '09:00';
  end_time   TIME := TIME '17:00';
  interval_min INTEGER := 30;
  t TIME;
  v_business_id uuid;
BEGIN
  -- Determine business for the dentist (first mapping), fallback to current context
  SELECT pb.business_id INTO v_business_id
  FROM public.provider_business_map pb
  JOIN public.dentists d ON d.profile_id = pb.provider_id
  WHERE d.id = p_dentist_id
  LIMIT 1;

  IF v_business_id IS NULL THEN
    v_business_id := public.get_current_business_id();
  END IF;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'No business context found for dentist %', p_dentist_id;
  END IF;

  -- Generate 30-min slots with proper business_id
  t := start_time;
  WHILE t < end_time LOOP
    INSERT INTO public.appointment_slots (business_id, dentist_id, slot_date, slot_time, is_available, emergency_only)
    VALUES (v_business_id, p_dentist_id, p_date, to_char(t, 'HH24:MI'), true, false)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;

    t := (t + make_interval(mins => interval_min));
  END LOOP;
END;
$$;