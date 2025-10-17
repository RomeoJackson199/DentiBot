-- Add currency field to clinic_settings
ALTER TABLE clinic_settings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'CAD', 'AUD'));