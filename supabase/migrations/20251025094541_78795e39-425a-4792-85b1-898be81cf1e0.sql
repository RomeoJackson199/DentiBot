-- Remove duplicate foreign key constraint on appointments table
-- This is causing "more than one relationship was found" errors in queries

-- Drop the duplicate foreign key constraint
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS fk_appointments_dentist;

-- Keep the standard constraint: appointments_dentist_id_fkey
-- This constraint already exists and properly links appointments(dentist_id) to dentists(id)