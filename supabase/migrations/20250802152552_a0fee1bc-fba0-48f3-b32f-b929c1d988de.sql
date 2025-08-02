-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Dentists can view patient profiles they have appointments with" ON public.profiles;

-- Create a security definer function to get current dentist ID safely
CREATE OR REPLACE FUNCTION public.get_current_dentist_id()
RETURNS UUID AS $$
  SELECT d.id 
  FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a simpler policy without recursive profile references
CREATE POLICY "Dentists can view patient profiles they have relationships with" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM appointments a
    WHERE a.dentist_id = public.get_current_dentist_id()
    AND a.patient_id = profiles.id
  )
  OR 
  EXISTS (
    SELECT 1 
    FROM medical_records mr
    WHERE mr.dentist_id = public.get_current_dentist_id()
    AND mr.patient_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM treatment_plans tp
    WHERE tp.dentist_id = public.get_current_dentist_id()
    AND tp.patient_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM notes n
    WHERE n.dentist_id = public.get_current_dentist_id()
    AND n.patient_id = profiles.id
  )
);