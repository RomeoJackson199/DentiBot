-- Create security definer function to check if user is a manager without RLS recursion
CREATE OR REPLACE FUNCTION public.is_restaurant_manager(p_business_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_staff_roles rsr
    JOIN public.profiles p ON p.id = rsr.profile_id
    WHERE rsr.business_id = p_business_id
      AND p.user_id = p_user_id
      AND rsr.role = 'manager'
      AND rsr.is_active = true
  );
$$;

-- Drop problematic policies on restaurant_staff_roles
DROP POLICY IF EXISTS "Business owners and managers can manage staff" ON public.restaurant_staff_roles;
DROP POLICY IF EXISTS "Business owners can manage staff roles" ON public.restaurant_staff_roles;
DROP POLICY IF EXISTS "Staff can view their own roles" ON public.restaurant_staff_roles;

-- Recreate owner policy with USING and WITH CHECK
CREATE POLICY "Business owners can manage staff roles"
ON public.restaurant_staff_roles
FOR ALL
USING (
  business_id IN (
    SELECT b.id
    FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT b.id
    FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Recreate manager policy using security definer function
CREATE POLICY "Managers can manage staff roles"
ON public.restaurant_staff_roles
FOR ALL
USING (public.is_restaurant_manager(business_id))
WITH CHECK (public.is_restaurant_manager(business_id));

-- Staff can view their own roles
CREATE POLICY "Staff can view their own roles"
ON public.restaurant_staff_roles
FOR SELECT
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Remove public visibility of codes for security
DROP POLICY IF EXISTS "Anyone can view active codes" ON public.restaurant_staff_codes;