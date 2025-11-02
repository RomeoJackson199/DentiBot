-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Business members can manage homepage settings" ON public.homepage_settings;

-- Create new policy that allows business owners to manage settings
CREATE POLICY "Business owners can manage homepage settings"
ON public.homepage_settings
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Also allow inserts for any authenticated business owner
CREATE POLICY "Authenticated users can create homepage for their businesses"
ON public.homepage_settings
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses
    WHERE owner_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);