-- Avoid RLS infinite recursion by removing self-referencing queries
-- 1) Helper mapping table from user_id -> profile_id (no profiles reads in policies)
CREATE TABLE IF NOT EXISTS public.user_profile_map (
  user_id uuid PRIMARY KEY,
  profile_id uuid UNIQUE NOT NULL
);

-- Backfill
INSERT INTO public.user_profile_map (user_id, profile_id)
SELECT user_id, id FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

-- Trigger to keep map in sync without selecting from profiles in policies
CREATE OR REPLACE FUNCTION public.sync_user_profile_map()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_profile_map (user_id, profile_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_profile_map WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_user_profile_map ON public.profiles;
CREATE TRIGGER trg_sync_user_profile_map
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile_map();

-- 2) Viewer profile id helper (reads only user_profile_map)
CREATE OR REPLACE FUNCTION public.viewer_profile_id(_viewer_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT profile_id FROM public.user_profile_map WHERE user_id = _viewer_user_id
$$;

-- 3) Re-implement functions used in profiles policies WITHOUT querying profiles
CREATE OR REPLACE FUNCTION public.can_view_profile_in_user_business_norec(_target_profile_id uuid, _viewer_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vp AS (
    SELECT profile_id FROM public.user_profile_map WHERE user_id = _viewer_user_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN vp ON vp.profile_id = bm.profile_id
    WHERE EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.patient_id = _target_profile_id
        AND a.business_id = bm.business_id
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dentist_patient_norec(patient_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vp AS (
    SELECT profile_id FROM public.user_profile_map WHERE user_id = auth.uid()
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN vp ON vp.profile_id = d.profile_id
    WHERE a.patient_id = patient_profile_id
  );
$$;

-- 4) Update profiles policies to use no-recursion functions
DROP POLICY IF EXISTS "Business members can view clinic patients (any business)" ON public.profiles;
CREATE POLICY "Business members can view clinic patients (any business)"
ON public.profiles
FOR SELECT
USING (public.can_view_profile_in_user_business_norec(id, auth.uid()));

DROP POLICY IF EXISTS "Dentists can view their patients' profiles" ON public.profiles;
CREATE POLICY "Dentists can view their patients' profiles"
ON public.profiles
FOR SELECT
USING (public.is_dentist_patient_norec(id));

-- 5) Update dentists policies to avoid selecting from profiles
DROP POLICY IF EXISTS "Dentists can create their record" ON public.dentists;
CREATE POLICY "Dentists can create their record"
ON public.dentists
FOR INSERT
WITH CHECK (
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'provider'::public.app_role))
  AND (profile_id = public.viewer_profile_id(auth.uid()))
);

DROP POLICY IF EXISTS "Dentists can update their own record" ON public.dentists;
CREATE POLICY "Dentists can update their own record"
ON public.dentists
FOR UPDATE
USING (profile_id = public.viewer_profile_id(auth.uid()));

DROP POLICY IF EXISTS "Dentists can view their own record" ON public.dentists;
CREATE POLICY "Dentists can view their own record"
ON public.dentists
FOR SELECT
USING (profile_id = public.viewer_profile_id(auth.uid()));