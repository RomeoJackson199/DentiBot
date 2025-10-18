-- Allow public read access to basic clinic information for clinic selection
DROP POLICY IF EXISTS "Public can view basic clinic info" ON public.clinic_settings;

CREATE POLICY "Public can view basic clinic info"
ON public.clinic_settings
FOR SELECT
TO anon, authenticated
USING (
  clinic_name IS NOT NULL 
  AND business_slug IS NOT NULL
);