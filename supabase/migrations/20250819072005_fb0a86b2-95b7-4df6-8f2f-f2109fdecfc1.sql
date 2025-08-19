-- Create helper functions for invitation system
CREATE OR REPLACE FUNCTION public.validate_invitation_token(invitation_token UUID)
RETURNS TABLE(
  id UUID,
  profile_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.id,
    it.profile_id,
    it.email,
    p.first_name,
    p.last_name,
    p.phone,
    it.expires_at
  FROM invitation_tokens it
  JOIN profiles p ON p.id = it.profile_id
  WHERE it.token = invitation_token
    AND it.expires_at > now()
    AND it.used = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_profile_to_user(profile_id UUID, user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET user_id = link_profile_to_user.user_id
  WHERE id = link_profile_to_user.profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_invitation_used(invitation_token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invitation_tokens 
  SET used = true, used_at = now()
  WHERE token = invitation_token;
END;
$$;