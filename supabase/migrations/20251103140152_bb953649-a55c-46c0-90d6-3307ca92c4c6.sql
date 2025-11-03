-- Allow restaurant and custom template types
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_template_type_check;

ALTER TABLE public.businesses
ADD CONSTRAINT businesses_template_type_check
CHECK (template_type IN (
  'dentist',
  'hairdresser',
  'personal_trainer',
  'beauty_salon',
  'medical',
  'generic',
  'restaurant',
  'custom'
));