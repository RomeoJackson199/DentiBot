-- Add romeojackson199@gmail.com as a provider
-- This will:
-- 1. Create a profile if it doesn't exist
-- 2. Assign the 'provider' role
-- 3. Create a provider record
-- 4. Create an invitation token for account setup

DO $$
DECLARE
  v_profile_id uuid;
  v_user_id uuid;
  v_provider_id uuid;
  v_token text;
BEGIN
  -- Check if profile already exists
  SELECT id, user_id INTO v_profile_id, v_user_id
  FROM profiles
  WHERE email = 'romeojackson199@gmail.com';

  -- If profile doesn't exist, create it
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (email, first_name, last_name)
    VALUES ('romeojackson199@gmail.com', 'Romeo', 'Jackson')
    RETURNING id INTO v_profile_id;
    
    RAISE NOTICE 'Created profile for romeojackson199@gmail.com with ID: %', v_profile_id;
  ELSE
    RAISE NOTICE 'Profile already exists with ID: %', v_profile_id;
  END IF;

  -- If user has an account (user_id exists), assign provider role
  IF v_user_id IS NOT NULL THEN
    -- Add provider role if not already assigned
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Assigned provider role to user';
  ELSE
    RAISE NOTICE 'No user account yet - invitation will be needed';
  END IF;

  -- Check if provider record already exists
  SELECT id INTO v_provider_id
  FROM providers
  WHERE profile_id = v_profile_id;

  -- Create provider record if it doesn't exist
  IF v_provider_id IS NULL THEN
    INSERT INTO providers (profile_id, is_active)
    VALUES (v_profile_id, true)
    RETURNING id INTO v_provider_id;
    
    RAISE NOTICE 'Created provider record with ID: %', v_provider_id;
  ELSE
    RAISE NOTICE 'Provider record already exists with ID: %', v_provider_id;
  END IF;

END $$;