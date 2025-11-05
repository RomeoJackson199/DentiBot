-- Add custom_config column to support extended template customization
-- This allows storing full custom template configuration including:
-- - Layout customization (colors, dashboard widgets, card styles)
-- - Appointment reasons
-- - Service categories
-- - Quick-add services
-- - AI behavior configuration
-- - Completion steps
-- - Navigation items
-- - Service field labels

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS custom_config JSONB;

COMMENT ON COLUMN businesses.custom_config IS 'Full custom template configuration (features, terminology, layout, services, AI behavior, etc.)';

-- Create index for faster JSON queries on custom_config
CREATE INDEX IF NOT EXISTS idx_businesses_custom_config ON businesses USING GIN (custom_config);
