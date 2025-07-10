-- Clean up all duplicate slots more thoroughly
DELETE FROM appointment_slots 
WHERE id NOT IN (
  SELECT MIN(id)
  FROM appointment_slots
  GROUP BY dentist_id, slot_date, slot_time
);

-- Remove all today's slots and regenerate them properly
DELETE FROM appointment_slots WHERE slot_date = CURRENT_DATE;

-- Generate clean slots for today for all dentists
INSERT INTO appointment_slots (dentist_id, slot_date, slot_time)
SELECT 
  d.id as dentist_id,
  CURRENT_DATE as slot_date,
  slot_time
FROM dentists d
CROSS JOIN (
  SELECT (time '09:00:00' + (n * interval '30 minutes'))::time as slot_time
  FROM generate_series(0, 15) n  -- 16 slots from 9:00 to 16:30
  WHERE (time '09:00:00' + (n * interval '30 minutes'))::time < time '17:00:00'
) times
WHERE d.is_active = true;