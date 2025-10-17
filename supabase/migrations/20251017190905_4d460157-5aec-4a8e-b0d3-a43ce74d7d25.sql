-- Create a function to add a dentist by email
CREATE OR REPLACE FUNCTION add_dentist_by_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  profile_record RECORD;
  dentist_exists BOOLEAN;
BEGIN
  -- Find user by email
  SELECT id, email INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RETURN 'ERROR: User not found with email ' || user_email;
  END IF;
  
  -- Check if profile exists
  SELECT id INTO profile_record
  FROM profiles
  WHERE user_id = user_record.id;
  
  IF profile_record.id IS NULL THEN
    RETURN 'ERROR: Profile not found for user ' || user_email;
  END IF;
  
  -- Check if already a dentist
  SELECT EXISTS(
    SELECT 1 FROM dentists WHERE profile_id = profile_record.id
  ) INTO dentist_exists;
  
  IF dentist_exists THEN
    RETURN 'User ' || user_email || ' is already a dentist';
  END IF;
  
  -- Add as dentist
  INSERT INTO dentists (profile_id, is_active)
  VALUES (profile_record.id, true);
  
  RETURN 'SUCCESS: Added ' || user_email || ' as dentist';
END;
$$;

-- Execute the function to add the dentist
SELECT add_dentist_by_email('romeojackson199@gmail.com');