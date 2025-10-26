-- Create security definer function to check business ownership
CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE b.id = _business_id
      AND p.user_id = _user_id
  );
$$;

-- Drop existing problematic policies on business_members
DROP POLICY IF EXISTS "Owners can add members" ON public.business_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.business_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.business_members;

-- Recreate policies using security definer function
CREATE POLICY "Owners can add members"
ON public.business_members
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
);

CREATE POLICY "Owners can update members"
ON public.business_members
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
);

CREATE POLICY "Owners can delete members"
ON public.business_members
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
);

-- Drop and recreate the businesses update policy that was causing recursion
DROP POLICY IF EXISTS "Business members can update business" ON public.businesses;

CREATE POLICY "Business members can update business"
ON public.businesses
FOR UPDATE
USING (
  owner_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = businesses.id
      AND bm.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
  )
)
WITH CHECK (
  owner_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = businesses.id
      AND bm.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
  )
);