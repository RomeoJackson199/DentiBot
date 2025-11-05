-- Add custom_config column to businesses table for full template configuration
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_config jsonb DEFAULT NULL;

-- Create index for custom_config queries
CREATE INDEX IF NOT EXISTS idx_businesses_custom_config ON businesses USING GIN (custom_config);

-- Add comment explaining the column
COMMENT ON COLUMN businesses.custom_config IS 'Full custom template configuration including features, terminology, layout, services, and AI settings';