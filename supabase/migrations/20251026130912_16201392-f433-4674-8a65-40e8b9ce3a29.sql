-- Allow business members to update their business branding
CREATE POLICY "Business members can update business"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
);

-- Allow business members to view their business
CREATE POLICY "Business members can view their business"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
);