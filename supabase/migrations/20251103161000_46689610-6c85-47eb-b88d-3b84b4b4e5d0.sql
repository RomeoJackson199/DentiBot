-- Ensure template_type column exists with restaurant option
-- The template_type column should already exist, but let's ensure it has the right default

-- Update any businesses that have restaurant-related services to use restaurant template
UPDATE businesses 
SET template_type = 'restaurant'
WHERE template_type != 'restaurant' 
AND id IN (
  SELECT DISTINCT business_id 
  FROM business_services 
  WHERE category IN ('Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Drinks', 'Entrees', 'Salads', 'Soups')
);

-- Add a helpful comment
COMMENT ON COLUMN businesses.template_type IS 'Template type determines the booking flow: dentist (service-based), restaurant (table reservation), etc.';