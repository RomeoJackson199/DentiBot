-- Policy for invitee to view pending staff invitations
DROP POLICY IF EXISTS "Invitees can view their pending staff invites" ON public.restaurant_staff_roles;
CREATE POLICY "Invitees can view their pending staff invites"
ON public.restaurant_staff_roles
FOR SELECT
USING (
  invitation_email IN (
    SELECT pr.email FROM public.profiles pr WHERE pr.user_id = auth.uid()
  )
  AND COALESCE(invitation_status, 'pending') = 'pending'
);

-- Secure RPC to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_restaurant_staff_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_user_email text;
  v_inv record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, email INTO v_profile_id, v_user_email FROM public.profiles WHERE user_id = v_user_id;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT * INTO v_inv
  FROM public.restaurant_staff_roles
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF COALESCE(v_inv.invitation_status, 'pending') <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending';
  END IF;

  IF v_inv.invitation_email IS NULL OR lower(v_inv.invitation_email) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'Invitation email does not match logged in user';
  END IF;

  UPDATE public.restaurant_staff_roles
  SET 
    profile_id = v_profile_id,
    invitation_status = 'accepted',
    updated_at = now(),
    is_active = true
  WHERE id = p_invitation_id;

  INSERT INTO public.business_members (business_id, profile_id, role)
  VALUES (v_inv.business_id, v_profile_id, v_inv.role)
  ON CONFLICT (business_id, profile_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'business_id', v_inv.business_id,
    'role', v_inv.role
  );
END;
$$;

-- Secure RPC to reject an invitation
CREATE OR REPLACE FUNCTION public.reject_restaurant_staff_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_inv record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE user_id = v_user_id;
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT * INTO v_inv
  FROM public.restaurant_staff_roles
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF COALESCE(v_inv.invitation_status, 'pending') <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending';
  END IF;

  IF v_inv.invitation_email IS NULL OR lower(v_inv.invitation_email) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'Invitation email does not match logged in user';
  END IF;

  UPDATE public.restaurant_staff_roles
  SET invitation_status = 'rejected', updated_at = now()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
