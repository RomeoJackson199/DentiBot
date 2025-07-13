-- Add missing patient fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN address TEXT,
ADD COLUMN emergency_contact TEXT;

-- Update the appointments table to ensure all patient data is properly stored
-- The appointments table already has most needed fields like patient_id, dentist_id
-- We just need to ensure the profiles table has all the patient information