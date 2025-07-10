-- Fix the generate_daily_slots function to work with PostgreSQL
CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  slot_time TIME;
  start_time TIME := '09:00';
  end_time TIME := '17:00';
  interval_minutes INTEGER := 30;
BEGIN
  -- Generate slots from 9:00 AM to 5:00 PM (every 30 minutes)
  slot_time := start_time;
  
  WHILE slot_time < end_time LOOP
    INSERT INTO public.appointment_slots (dentist_id, slot_date, slot_time)
    VALUES (p_dentist_id, p_date, slot_time)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;
    
    -- Add 30 minutes to the current slot time
    slot_time := slot_time + (interval_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$function$;