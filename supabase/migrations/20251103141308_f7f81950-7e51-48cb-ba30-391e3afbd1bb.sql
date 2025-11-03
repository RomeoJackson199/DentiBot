-- Ensure businesses.template_type allows all supported templates
-- 1) Drop old constraint if it exists
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS valid_template_type;

-- 2) Recreate constraint with the complete, current set of TemplateType values
-- Source of truth: src/lib/businessTemplates.ts (TemplateType)
ALTER TABLE public.businesses
ADD CONSTRAINT valid_template_type
CHECK (template_type IN (
  'dentist',
  'hairdresser',
  'restaurant',
  'generic',
  'custom'
));
