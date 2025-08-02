-- First, remove duplicate appointment slots that might conflict
DELETE FROM appointment_slots 
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e'
AND (dentist_id, slot_date, slot_time) IN (
  SELECT dentist_id, slot_date, slot_time 
  FROM appointment_slots 
  WHERE dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
);

-- Now safely update remaining appointment slots
UPDATE appointment_slots 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Update appointments 
UPDATE appointments 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Update dentist availability
UPDATE dentist_availability 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Remove the duplicate dentist entry
DELETE FROM dentists 
WHERE id = '2014080c-d497-4ff9-98de-ccc5982ed94e';