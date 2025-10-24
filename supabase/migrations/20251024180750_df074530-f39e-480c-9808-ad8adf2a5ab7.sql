-- Drop the problematic policy
DROP POLICY IF EXISTS "Business members can view clinic patients" ON public.profiles;

-- Create security definer function to check if user is in current business
CREATE OR REPLACE FUNCTION public.is_user_business_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = _user_id
      AND bm.business_id = get_current_business_id()
  );
$$;

-- Create security definer function to check if profile is clinic patient
CREATE OR REPLACE FUNCTION public.is_clinic_patient(_profile_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE patient_id = _profile_id
      AND business_id = _business_id
  );
$$;

-- Recreate the policy using security definer functions
CREATE POLICY "Business members can view clinic patients"
ON public.profiles
FOR SELECT
USING (
  is_user_business_member(auth.uid())
  AND is_clinic_patient(id, get_current_business_id())
);