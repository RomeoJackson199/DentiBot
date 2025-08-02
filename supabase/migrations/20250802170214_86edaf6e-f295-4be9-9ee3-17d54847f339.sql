-- First, drop the problematic policy
DROP POLICY IF EXISTS "Dentists can view their patients' profiles" ON public.profiles;

-- Create a security definer function to check if a user is a dentist who can view a specific patient
CREATE OR REPLACE FUNCTION public.is_dentist_for_patient(patient_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles dentist_profile ON dentist_profile.id = d.profile_id
    WHERE a.patient_id = patient_profile_id 
    AND dentist_profile.user_id = auth.uid()
  );
$$;

-- Now create the policy using the security definer function
CREATE POLICY "Dentists can view their patients' profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_dentist_for_patient(profiles.id));