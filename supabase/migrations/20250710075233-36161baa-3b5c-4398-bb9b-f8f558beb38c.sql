-- Clean up all slots for today and recreate them properly
DELETE FROM appointment_slots WHERE slot_date = CURRENT_DATE;

-- Generate clean slots for today for the first dentist (to test)
DO $$
DECLARE
    dentist_record RECORD;
    slot_time TIME;
    start_time TIME := '09:00';
    end_time TIME := '17:00';
    interval_minutes INTEGER := 30;
BEGIN
    -- Get first active dentist
    SELECT id INTO dentist_record FROM dentists WHERE is_active = true LIMIT 1;
    
    IF dentist_record.id IS NOT NULL THEN
        slot_time := start_time;
        
        WHILE slot_time < end_time LOOP
            INSERT INTO appointment_slots (dentist_id, slot_date, slot_time)
            VALUES (dentist_record.id, CURRENT_DATE, slot_time);
            
            slot_time := slot_time + (interval_minutes || ' minutes')::INTERVAL;
        END LOOP;
    END IF;
END $$;