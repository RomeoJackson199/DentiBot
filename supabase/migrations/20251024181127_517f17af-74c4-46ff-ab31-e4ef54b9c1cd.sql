-- Replace profile visibility policy to avoid reliance on current business context
DROP POLICY IF EXISTS "Business members can view clinic patients" ON public.profiles;

-- Helper: check if a user is member of a given business
CREATE OR REPLACE FUNCTION public.is_user_member_of_business(_user_id uuid, _business_id uuid)
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
      AND bm.business_id = _business_id
  );
$$;

-- Helper: can viewer see target profile based on shared business via appointments
CREATE OR REPLACE FUNCTION public.can_view_profile_in_user_business(_target_profile_id uuid, _viewer_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.profiles vp ON vp.id = bm.profile_id
    WHERE vp.user_id = _viewer_user_id
      AND EXISTS (
        SELECT 1
        FROM public.appointments a
        WHERE a.patient_id = _target_profile_id
          AND a.business_id = bm.business_id
      )
  );
$$;

-- Recreate a clean, non-recursive policy for profiles
CREATE POLICY "Business members can view clinic patients (any business)"
ON public.profiles
FOR SELECT
USING (
  public.can_view_profile_in_user_business(id, auth.uid())
);

-- Ensure read-only viewing across resources without requiring current business context
-- Appointments
DROP POLICY IF EXISTS "Business members can view their business appointments" ON public.appointments;
CREATE POLICY "Business members can view their business appointments"
ON public.appointments
FOR SELECT
USING (
  public.is_user_member_of_business(auth.uid(), business_id)
);

-- Treatment plans
DROP POLICY IF EXISTS "Business members can view treatment plans" ON public.treatment_plans;
CREATE POLICY "Business members can view treatment plans"
ON public.treatment_plans
FOR SELECT
USING (
  public.is_user_member_of_business(auth.uid(), business_id)
);

-- Medical records
DROP POLICY IF EXISTS "Business members can view medical records" ON public.medical_records;
CREATE POLICY "Business members can view medical records"
ON public.medical_records
FOR SELECT
USING (
  public.is_user_member_of_business(auth.uid(), business_id)
);
