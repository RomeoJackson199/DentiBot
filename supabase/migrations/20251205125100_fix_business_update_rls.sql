-- Fix business update RLS policy to allow both business owners and members to update

-- Drop existing update policy
DROP POLICY IF EXISTS "Business members can update business" ON public.businesses;

-- Create new policy that allows both owners and members
CREATE POLICY "Business owners and members can update business"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is the owner
  owner_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  -- Allow if user is a business member
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
)
WITH CHECK (
  -- Same check for WITH CHECK
  owner_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
);

-- Also update the SELECT policy to allow owners to view
DROP POLICY IF EXISTS "Business members can view their business" ON public.businesses;

CREATE POLICY "Business owners and members can view business"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  -- Allow if user is the owner
  owner_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  -- Allow if user is a business member
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = businesses.id
  )
);
