-- Update all foreign key references first
UPDATE notes SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
UPDATE medical_records SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
UPDATE prescriptions SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
UPDATE treatment_plans SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
UPDATE patient_documents SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
UPDATE calendar_events SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570' WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Now delete duplicate slots and availability
DELETE FROM appointment_slots WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';
DELETE FROM dentist_availability WHERE dentist_id = '2014080c-d497-4ff9-98de-ccc5982ed94e';

-- Finally delete the duplicate dentist record
DELETE FROM dentists WHERE id = '2014080c-d497-4ff9-98de-ccc5982ed94e';