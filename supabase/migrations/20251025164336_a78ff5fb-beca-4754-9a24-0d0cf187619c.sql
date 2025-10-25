-- Fix profiles RLS to allow viewing active dentist profiles
DO $$
BEGIN
  -- Drop old restrictive policy if exists
  DROP POLICY IF EXISTS "Public can view profiles of active dentists" ON public.profiles;
  
  -- Create new policy allowing viewing of active dentist profiles
  CREATE POLICY "Public can view profiles of active dentists"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      WHERE d.profile_id = profiles.id
        AND d.is_active = true
    )
  );
END $$;