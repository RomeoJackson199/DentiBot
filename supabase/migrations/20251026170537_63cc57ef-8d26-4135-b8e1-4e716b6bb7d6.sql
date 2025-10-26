-- Add template_type column to businesses table
ALTER TABLE businesses 
ADD COLUMN template_type text NOT NULL DEFAULT 'dentist';

-- Add check constraint for valid template types
ALTER TABLE businesses 
ADD CONSTRAINT valid_template_type 
CHECK (template_type IN ('dentist', 'hairdresser', 'personal_trainer', 'beauty_salon', 'medical', 'generic'));

-- Add comment explaining the column
COMMENT ON COLUMN businesses.template_type IS 'Business template type that determines available features and terminology';