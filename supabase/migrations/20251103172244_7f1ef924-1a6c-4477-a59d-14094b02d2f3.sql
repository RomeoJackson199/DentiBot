-- Fix create_restaurant_staff_invitation to avoid RLS recursion
DROP FUNCTION IF EXISTS public.create_restaurant_staff_invitation(uuid, text, text);

CREATE OR REPLACE FUNCTION public.create_restaurant_staff_invitation(p_business_id uuid, p_email text, p_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_profile_id uuid;
  v_existing_profile_id uuid;
  v_invitation_id uuid;
  v_is_owner boolean := false;
  v_is_manager boolean := false;
BEGIN
  -- Get inviter's profile
  SELECT id INTO v_inviter_profile_id 
  FROM profiles 
  WHERE user_id = auth.uid();

  IF v_inviter_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if user is owner (direct query, no RLS)
  SELECT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_profile_id = v_inviter_profile_id
  ) INTO v_is_owner;

  -- Check if user is manager (direct query, no RLS)
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM restaurant_staff_roles
      WHERE business_id = p_business_id
      AND profile_id = v_inviter_profile_id
      AND role = 'manager'
      AND is_active = true
    ) INTO v_is_manager;
  END IF;

  IF NOT v_is_owner AND NOT v_is_manager THEN
    RAISE EXCEPTION 'Not authorized to invite staff';
  END IF;

  -- Check if profile already exists
  SELECT id INTO v_existing_profile_id 
  FROM profiles 
  WHERE email = p_email;

  -- Check for existing invitation or membership
  IF EXISTS (
    SELECT 1 FROM restaurant_staff_roles
    WHERE business_id = p_business_id
    AND (
      (profile_id = v_existing_profile_id AND v_existing_profile_id IS NOT NULL)
      OR (invitation_email = p_email AND invitation_status = 'pending')
    )
  ) THEN
    RAISE EXCEPTION 'Staff member already exists or has pending invitation';
  END IF;

  -- Create invitation
  INSERT INTO restaurant_staff_roles (
    business_id,
    profile_id,
    invitation_email,
    role,
    invitation_status,
    invited_by_profile_id,
    is_active
  ) VALUES (
    p_business_id,
    v_existing_profile_id,
    p_email,
    p_role,
    CASE WHEN v_existing_profile_id IS NOT NULL THEN 'accepted' ELSE 'pending' END,
    v_inviter_profile_id,
    CASE WHEN v_existing_profile_id IS NOT NULL THEN true ELSE false END
  )
  RETURNING id INTO v_invitation_id;

  -- If profile exists, also add to business_members
  IF v_existing_profile_id IS NOT NULL THEN
    INSERT INTO business_members (business_id, profile_id, role)
    VALUES (p_business_id, v_existing_profile_id, p_role)
    ON CONFLICT (business_id, profile_id) DO NOTHING;
  END IF;

  RETURN v_invitation_id;
END;
$$;
