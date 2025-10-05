-- Add branding fields to clinic_settings table
ALTER TABLE clinic_settings
ADD COLUMN IF NOT EXISTS clinic_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2D5D7B',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8B5CF6';