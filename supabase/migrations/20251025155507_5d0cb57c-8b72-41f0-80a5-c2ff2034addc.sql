-- Add address field to clinic_settings
ALTER TABLE clinic_settings 
ADD COLUMN IF NOT EXISTS address TEXT;