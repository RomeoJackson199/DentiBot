-- Allow public read of dentist names via controlled function-based policy
-- 1) Security definer helper to check if a profile belongs to an active dentist
CREATE OR REPLACE FUNCTION public.is_active_dentist_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dentists d
    WHERE d.profile_id = p_profile_id AND d.is_active = true
  );
$$;

-- 2) Add SELECT policy on profiles for active dentists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Public can view profiles of active dentists'
  ) THEN
    CREATE POLICY "Public can view profiles of active dentists"
    ON public.profiles
    FOR SELECT
    USING (public.is_active_dentist_profile(id));
  END IF;
END$$;

-- 3) Pre-generate appointment slots for next 14 days for Dr. Romeo Jackson
DO $$
DECLARE
  v_dentist_id uuid;
BEGIN
  SELECT d.id INTO v_dentist_id
  FROM public.dentists d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE lower(p.email) = lower('romeojackson199@gmail.com')
  LIMIT 1;

  IF v_dentist_id IS NOT NULL THEN
    FOR i IN 0..14 LOOP
      PERFORM public.generate_daily_slots(v_dentist_id, (current_date + i));
    END LOOP;
  END IF;
END$$;