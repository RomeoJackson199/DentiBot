-- Add RPC to safely get current user's dentist ID
CREATE OR REPLACE FUNCTION public.get_current_dentist_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id
  FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Add RPC to ensure current user is registered as dentist
CREATE OR REPLACE FUNCTION public.ensure_current_user_is_dentist()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id_var uuid;
  dentist_id_var uuid;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO profile_id_var
  FROM profiles
  WHERE user_id = auth.uid();

  IF profile_id_var IS NULL THEN
    RAISE EXCEPTION 'No profile found for current user';
  END IF;

  -- Check if dentist record exists, create if not
  SELECT id INTO dentist_id_var
  FROM dentists
  WHERE profile_id = profile_id_var;

  IF dentist_id_var IS NULL THEN
    INSERT INTO dentists (profile_id, is_active)
    VALUES (profile_id_var, true)
    RETURNING id INTO dentist_id_var;
  END IF;

  -- Upsert dentist role into user_roles (idempotent)
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), 'dentist')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN dentist_id_var;
END;
$$;

-- Ensure SELECT policy on user_roles for users to read their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());