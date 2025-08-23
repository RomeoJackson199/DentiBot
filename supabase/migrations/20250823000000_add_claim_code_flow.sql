-- Add short code support for invitation tokens and secure claim flow

-- 1) Add short_code column for 6-digit codes and supporting index
ALTER TABLE public.invitation_tokens
ADD COLUMN IF NOT EXISTS short_code TEXT;

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_short_code
ON public.invitation_tokens(short_code);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email_active
ON public.invitation_tokens(email, used, expires_at);

-- 2) Helper: check if current authenticated user has an imported profile (by email) not yet linked
CREATE OR REPLACE FUNCTION public.has_imported_profile_for_current_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_exists BOOLEAN := FALSE;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN FALSE;
  END IF;

  PERFORM 1 FROM public.profiles p
  WHERE p.email = v_email AND p.user_id IS NULL
  LIMIT 1;

  IF FOUND THEN
    v_exists := TRUE;
  END IF;

  RETURN v_exists;
END;
$$;

-- 3) Generate a 6-digit claim code for the current authenticated user's email
CREATE OR REPLACE FUNCTION public.create_claim_code_for_current_user(p_expires_minutes INTEGER DEFAULT 15)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_profile_id UUID;
  v_code TEXT;
  v_token UUID;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE email = v_email AND user_id IS NULL
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No unclaimed profile for this email';
  END IF;

  -- Clean up existing tokens for this email
  DELETE FROM public.invitation_tokens 
  WHERE email = v_email;

  -- Generate a 6-digit numeric code, left-padded with zeros
  v_code := lpad(((floor(random() * 1000000))::INT)::TEXT, 6, '0');
  v_token := gen_random_uuid();

  INSERT INTO public.invitation_tokens (
    profile_id,
    token,
    email,
    expires_at,
    used,
    short_code
  ) VALUES (
    v_profile_id,
    v_token,
    v_email,
    now() + (p_expires_minutes || ' minutes')::INTERVAL,
    FALSE,
    v_code
  );

  RETURN v_code;
END;
$$;

-- 4) Claim and link the imported profile to the current user using the 6-digit code
CREATE OR REPLACE FUNCTION public.claim_profile_with_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_profile_id UUID;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate code
  SELECT it.profile_id INTO v_profile_id
  FROM public.invitation_tokens it
  WHERE it.short_code = p_code
    AND it.email = v_email
    AND it.used = FALSE
    AND it.expires_at > now()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;

  -- Link profile to current user
  PERFORM public.link_profile_to_user(v_profile_id, auth.uid());

  -- Mark token used
  UPDATE public.invitation_tokens
  SET used = TRUE, used_at = now()
  WHERE short_code = p_code AND email = v_email;

  RETURN TRUE;
END;
$$;