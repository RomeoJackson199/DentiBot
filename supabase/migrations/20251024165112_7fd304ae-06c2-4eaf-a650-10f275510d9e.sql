-- Allow public to view business members so patients can see available dentists
CREATE POLICY "Anyone can view business members for dentist discovery"
ON public.business_members
FOR SELECT
USING (true);

-- Note: This allows patients to see which dentists work at which clinics
-- This is necessary for appointment booking
-- Personal data is still protected by RLS on the profiles/dentists tables