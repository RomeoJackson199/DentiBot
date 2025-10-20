-- Generate 30 days of appointment slots for all active dentists
DO $$
DECLARE
  v_dentist record;
BEGIN
  FOR v_dentist IN 
    SELECT id FROM public.dentists WHERE is_active = true
  LOOP
    FOR i IN 0..30 LOOP
      PERFORM public.generate_daily_slots(v_dentist.id, (current_date + i));
    END LOOP;
  END LOOP;
END$$;