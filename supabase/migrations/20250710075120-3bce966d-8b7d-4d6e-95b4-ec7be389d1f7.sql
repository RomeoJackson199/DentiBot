-- Clean up duplicate slots and add better constraints
DELETE FROM appointment_slots a1 
USING appointment_slots a2 
WHERE a1.id > a2.id 
  AND a1.dentist_id = a2.dentist_id 
  AND a1.slot_date = a2.slot_date 
  AND a1.slot_time = a2.slot_time;

-- Update the unique constraint to prevent duplicates
ALTER TABLE appointment_slots 
DROP CONSTRAINT IF EXISTS unique_dentist_slot;

ALTER TABLE appointment_slots 
ADD CONSTRAINT unique_dentist_slot 
UNIQUE (dentist_id, slot_date, slot_time);