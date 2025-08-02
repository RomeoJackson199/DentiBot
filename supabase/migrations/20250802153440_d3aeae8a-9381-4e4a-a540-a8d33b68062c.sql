-- Remove all conflicting policies that cause infinite recursion
DROP POLICY IF EXISTS "Dentists can view patient profiles they have relationships with" ON public.profiles;
DROP POLICY IF EXISTS "Dentists can view patient profiles through appointments" ON public.profiles;

-- Drop the problematic functions that cause recursion
DROP FUNCTION IF EXISTS public.get_current_dentist_id();
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a simple, direct approach for RLS
-- Users can always see their own profile
-- Dentists can see profiles where they have appointments
CREATE POLICY "Dentists can view patients through appointments directly" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM appointments a 
    JOIN dentists d ON d.id = a.dentist_id 
    JOIN profiles dp ON dp.id = d.profile_id 
    WHERE dp.user_id = auth.uid() 
    AND a.patient_id = profiles.id
  )
);