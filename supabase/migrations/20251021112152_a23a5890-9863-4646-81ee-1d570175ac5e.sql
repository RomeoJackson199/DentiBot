-- First, drop the problematic policy
DROP POLICY IF EXISTS "Dentists can view their patients' profiles" ON public.profiles;

-- Create a security definer function to check if a profile is a patient of the current user's dentist practice
CREATE OR REPLACE FUNCTION public.is_dentist_patient(patient_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE a.patient_id = patient_profile_id
      AND p.user_id = auth.uid()
  );
$$;

-- Create a new policy using the security definer function
CREATE POLICY "Dentists can view their patients' profiles"
ON public.profiles
FOR SELECT
USING (public.is_dentist_patient(id));