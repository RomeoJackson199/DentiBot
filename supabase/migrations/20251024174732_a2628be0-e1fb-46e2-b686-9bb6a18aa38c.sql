-- Create function to handle dentist invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_dentist_invitation(
  p_invitation_id uuid,
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_dentist_id uuid;
  v_invitation_email text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get profile
  SELECT id, email INTO v_profile_id, v_invitation_email
  FROM profiles
  WHERE user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Verify invitation belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM dentist_invitations
    WHERE id = p_invitation_id
      AND invitee_email = v_invitation_email
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Update invitation status
  UPDATE dentist_invitations
  SET status = 'accepted',
      responded_at = now(),
      invitee_profile_id = v_profile_id
  WHERE id = p_invitation_id;
  
  -- Assign provider role
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'provider'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create or update dentist record
  INSERT INTO dentists (profile_id, first_name, last_name, email, is_active)
  SELECT 
    v_profile_id,
    COALESCE(first_name, ''),
    COALESCE(last_name, ''),
    COALESCE(email, ''),
    true
  FROM profiles
  WHERE id = v_profile_id
  ON CONFLICT (profile_id) 
  DO UPDATE SET is_active = true
  RETURNING id INTO v_dentist_id;
  
  -- Add to business_members
  INSERT INTO business_members (business_id, profile_id, role)
  VALUES (p_business_id, v_profile_id, 'dentist')
  ON CONFLICT (business_id, profile_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'dentist_id', v_dentist_id,
    'profile_id', v_profile_id
  );
END;
$$;