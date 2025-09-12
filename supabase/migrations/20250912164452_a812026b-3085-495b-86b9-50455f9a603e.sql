-- Fix infinite recursion in profiles RLS by using a SECURITY DEFINER function

-- 1) Drop the recursive policy
DROP POLICY IF EXISTS "Dentists can view patient basic info" ON public.profiles;

-- 2) Create a SECURITY DEFINER helper to check dentist-patient relationship without referencing profiles in-policy
CREATE OR REPLACE FUNCTION public.can_current_dentist_view_patient(p_patient_profile_id uuid)
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
    WHERE a.patient_id = p_patient_profile_id
      AND d.profile_id = public.get_current_user_profile_id()
  );
$$;

-- 3) Recreate the policy using the helper (no recursion)
CREATE POLICY "Dentists can view patient basic info" 
ON public.profiles 
FOR SELECT
USING (
  public.can_current_dentist_view_patient(profiles.id)
);
