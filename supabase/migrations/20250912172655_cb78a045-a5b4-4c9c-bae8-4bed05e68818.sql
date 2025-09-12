-- Resolve infinite recursion in RLS policies (dentists, appointments) and simplify insurance providers policy

-- 1) DENTISTS: replace recursive policies with definer-based checks
DROP POLICY IF EXISTS "Patients can view their dentist basic info" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can manage their own profile" ON public.dentists;

-- Helper: check if current user owns the dentist row (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_dentist_owner(p_dentist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM dentists d
    WHERE d.id = p_dentist_id
      AND d.profile_id = public.get_current_user_profile_id()
  );
$$;

-- Simpler read policy: authenticated users can view active dentists
CREATE POLICY "Authenticated users can view dentist booking info"
ON public.dentists
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Manage policy: dentist owners can manage their row (no recursion)
CREATE POLICY "Dentists can manage their own profile"
ON public.dentists
FOR ALL
USING (public.is_current_user_dentist_owner(dentists.id));


-- 2) APPOINTMENTS: remove joins to dentists/profiles inside policies
DROP POLICY IF EXISTS "Dentists can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;

-- Helper: is current user the dentist for a given dentist_id
CREATE OR REPLACE FUNCTION public.current_user_is_dentist_for(p_dentist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM dentists d
    WHERE d.id = p_dentist_id
      AND d.profile_id = public.get_current_user_profile_id()
  );
$$;

-- Dentists can manage their own appointments (view/update/etc.)
CREATE POLICY "Dentists can manage own appointments"
ON public.appointments
FOR ALL
USING (public.current_user_is_dentist_for(appointments.dentist_id));

-- Patients can manage their own appointments
CREATE POLICY "Patients can manage own appointments"
ON public.appointments
FOR ALL
USING (appointments.patient_id = public.get_current_user_profile_id());


-- 3) INSURANCE PROVIDERS: simplify to authenticated only (avoid joins)
DROP POLICY IF EXISTS "Authorized users can view insurance providers" ON public.insurance_providers;
CREATE POLICY "Authenticated users can view insurance providers"
ON public.insurance_providers
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);
