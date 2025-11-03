-- Ensure WITH CHECK is present to allow inserts/updates
DROP POLICY IF EXISTS "Business owners and managers can manage staff codes" ON public.restaurant_staff_codes;

CREATE POLICY "Business owners and managers can manage staff codes"
ON public.restaurant_staff_codes
FOR ALL
USING (public.can_manage_restaurant_staff(business_id))
WITH CHECK (public.can_manage_restaurant_staff(business_id));