-- Generate appointment slots for ALL dentists for the next 7 days
DO $$
DECLARE
    dentist_record RECORD;
    target_date DATE;
BEGIN
    -- Loop through all active dentists
    FOR dentist_record IN SELECT id FROM dentists WHERE is_active = true LOOP
        -- Generate slots for the next 7 days
        FOR i IN 0..6 LOOP
            target_date := CURRENT_DATE + i;
            
            -- Skip weekends (Saturday = 6, Sunday = 0)
            IF EXTRACT(DOW FROM target_date) NOT IN (0, 6) THEN
                PERFORM generate_daily_slots(dentist_record.id, target_date);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create default availability for all dentists (Monday-Friday, 7:00-17:00)
INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available, break_start_time, break_end_time)
SELECT 
    d.id,
    day_num,
    '07:00'::time,
    '17:00'::time,
    true,
    '12:00'::time,
    '13:00'::time
FROM dentists d
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS days(day_num)  -- Monday to Friday
WHERE d.is_active = true
ON CONFLICT (dentist_id, day_of_week) DO NOTHING;

-- Add unique constraint to prevent double-booking slots
ALTER TABLE appointment_slots 
ADD CONSTRAINT unique_dentist_slot 
UNIQUE (dentist_id, slot_date, slot_time);

-- Add foreign key constraints for data integrity
ALTER TABLE appointment_slots 
ADD CONSTRAINT fk_appointment_slots_dentist 
FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE;

ALTER TABLE appointment_slots 
ADD CONSTRAINT fk_appointment_slots_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

ALTER TABLE calendar_events 
ADD CONSTRAINT fk_calendar_events_dentist 
FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE;

ALTER TABLE calendar_events 
ADD CONSTRAINT fk_calendar_events_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE dentist_availability 
ADD CONSTRAINT fk_dentist_availability_dentist 
FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE;