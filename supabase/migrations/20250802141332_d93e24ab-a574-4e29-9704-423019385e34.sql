-- Simply delete the newer dentist record and all its associated data
DELETE FROM appointment_slots WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
DELETE FROM dentist_availability WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
DELETE FROM dentists WHERE id = '2014080c-d497-4ff9-98de-ccc5982ed94e';