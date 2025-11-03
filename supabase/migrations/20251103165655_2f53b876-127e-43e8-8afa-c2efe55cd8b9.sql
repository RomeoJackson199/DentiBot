-- Create security definer function to check if user can manage restaurant staff
CREATE OR REPLACE FUNCTION public.can_manage_restaurant_staff(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Check if user is business owner
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE b.id = p_business_id
    AND p.user_id = auth.uid()
  )
  OR EXISTS (
    -- Check if user is an active manager at this business
    SELECT 1 FROM public.restaurant_staff_roles rsr
    JOIN public.profiles p ON p.id = rsr.profile_id
    WHERE rsr.business_id = p_business_id
    AND p.user_id = auth.uid()
    AND rsr.role = 'manager'
    AND rsr.is_active = true
  );
$$;

-- Drop and recreate the policy using the security definer function
DROP POLICY IF EXISTS "Business owners and managers can manage staff codes" ON public.restaurant_staff_codes;

CREATE POLICY "Business owners and managers can manage staff codes"
ON public.restaurant_staff_codes
FOR ALL
USING (public.can_manage_restaurant_staff(business_id));