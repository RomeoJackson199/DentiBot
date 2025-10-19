-- Ensure Romeo Jackson is added as a provider (dentist)
DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  -- Find auth user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('romeojackson199@gmail.com');

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found in auth.users. Ask them to sign up first.', 'romeojackson199@gmail.com';
    RETURN;
  END IF;

  -- Try to find existing profile by user_id, fallback by email
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_user_id;
  IF v_profile_id IS NULL THEN
    SELECT id INTO v_profile_id FROM profiles WHERE lower(email) = lower('romeojackson199@gmail.com');
  END IF;

  -- Upsert profile ensuring user_id is set
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (user_id, email, first_name, last_name)
    VALUES (v_user_id, 'romeojackson199@gmail.com', 'Romeo', 'Jackson')
    RETURNING id INTO v_profile_id;
  ELSE
    UPDATE profiles
    SET user_id = v_user_id,
        email = 'romeojackson199@gmail.com',
        updated_at = now()
    WHERE id = v_profile_id;
  END IF;

  -- Assign provider role to the user
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'provider'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create provider record if missing
  INSERT INTO providers (profile_id, specialization, is_active)
  SELECT v_profile_id, 'General Dentistry', true
  WHERE NOT EXISTS (
    SELECT 1 FROM providers WHERE profile_id = v_profile_id
  );
END $$;