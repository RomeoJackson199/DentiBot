-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.create_invitation_token(
  p_profile_id UUID,
  p_email TEXT,
  p_expires_hours INTEGER DEFAULT 72
) RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO public.invitation_tokens (
    profile_id,
    email,
    expires_at
  ) VALUES (
    p_profile_id,
    p_email,
    now() + (p_expires_hours || ' hours')::INTERVAL
  ) RETURNING token INTO token_id;
  
  RETURN token_id;
END;
$$;