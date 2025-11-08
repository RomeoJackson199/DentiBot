-- Drop the old constraint that doesn't include healthcare
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS valid_template_type;

-- Update all existing businesses to use healthcare template
UPDATE businesses 
SET template_type = 'healthcare'
WHERE template_type IN ('dentist', 'hairdresser', 'restaurant', 'generic', 'custom');

-- Set default for future businesses
ALTER TABLE businesses 
ALTER COLUMN template_type SET DEFAULT 'healthcare';