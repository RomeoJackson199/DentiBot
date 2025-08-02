-- Fix Romeo Jackson duplicate dentist entries
-- First, update all appointments to use the older dentist ID (which has the appointments)
UPDATE appointments 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Update appointment slots as well
UPDATE appointment_slots 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Update dentist availability
UPDATE dentist_availability 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Remove the duplicate dentist entry
DELETE FROM dentists 
WHERE id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Update the profile to point to the correct dentist record
-- The profile that should remain is the one linked to the remaining dentist
UPDATE profiles 
SET id = '2260749e-99ac-4556-96e3-5ccdc665b057'
WHERE id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

-- Clean up any orphaned profile
DELETE FROM profiles 
WHERE id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';