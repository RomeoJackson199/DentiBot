-- Drop the problematic policy
DROP POLICY IF EXISTS "Business owners can manage staff codes" ON public.restaurant_staff_codes;

-- Create a better policy that doesn't cause recursion
CREATE POLICY "Business owners and managers can manage staff codes"
ON public.restaurant_staff_codes
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.restaurant_staff_roles rsr
    WHERE rsr.business_id = restaurant_staff_codes.business_id
    AND rsr.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND rsr.role = 'manager'
    AND rsr.is_active = true
  )
);