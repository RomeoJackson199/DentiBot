-- Add romeojackson199@gmail.com as a provider
DO $$
DECLARE
  v_profile_id uuid;
  v_user_id uuid;
BEGIN
  -- Check if profile exists
  SELECT id, user_id INTO v_profile_id, v_user_id
  FROM profiles
  WHERE email = 'romeojackson199@gmail.com';

  -- Create profile if it doesn't exist
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (email, first_name, last_name)
    VALUES ('romeojackson199@gmail.com', 'Romeo', 'Jackson')
    RETURNING id INTO v_profile_id;
  END IF;

  -- Add provider role if user exists
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Create provider record if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM providers WHERE profile_id = v_profile_id) THEN
    INSERT INTO providers (profile_id, specialization, is_active)
    VALUES (v_profile_id, 'General Dentistry', true);
  END IF;
END $$;