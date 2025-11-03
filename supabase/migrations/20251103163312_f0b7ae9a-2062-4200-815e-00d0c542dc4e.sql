-- Add invitation fields to restaurant_staff_roles
ALTER TABLE public.restaurant_staff_roles 
  ALTER COLUMN profile_id DROP NOT NULL,
  ADD COLUMN invitation_email text,
  ADD COLUMN invitation_status text DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'expired')),
  ADD COLUMN invited_by_profile_id uuid REFERENCES public.profiles(id),
  ADD COLUMN invitation_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN invited_at timestamp with time zone DEFAULT now(),
  ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- Create index for faster email lookups
CREATE INDEX idx_restaurant_staff_invitation_email ON public.restaurant_staff_roles(invitation_email) WHERE invitation_status = 'pending';

-- Create function to link staff invitation on login
CREATE OR REPLACE FUNCTION public.link_restaurant_staff_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
  user_email text;
BEGIN
  -- Get the user's email and profile
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  SELECT id INTO user_profile_id FROM profiles WHERE user_id = NEW.id;

  -- Link any pending staff invitations
  UPDATE restaurant_staff_roles
  SET 
    profile_id = user_profile_id,
    invitation_status = 'accepted',
    updated_at = now()
  WHERE 
    invitation_email = user_email
    AND invitation_status = 'pending'
    AND expires_at > now();

  RETURN NEW;
END;
$$;

-- Create trigger to auto-link staff on login
DROP TRIGGER IF EXISTS on_auth_user_login_link_staff ON auth.users;
CREATE TRIGGER on_auth_user_login_link_staff
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_restaurant_staff_on_login();

-- Update RLS policies for restaurant_staff_roles
DROP POLICY IF EXISTS "Business members can manage staff" ON public.restaurant_staff_roles;
DROP POLICY IF EXISTS "Staff can view their own roles" ON public.restaurant_staff_roles;

-- Business owners and managers can manage staff
CREATE POLICY "Business owners and managers can manage staff"
ON public.restaurant_staff_roles
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM businesses b
    JOIN profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
  OR
  (
    business_id IN (
      SELECT rsr.business_id FROM restaurant_staff_roles rsr
      JOIN profiles p ON p.id = rsr.profile_id
      WHERE p.user_id = auth.uid()
      AND rsr.role = 'manager'
      AND rsr.is_active = true
    )
  )
);

-- Staff can view their own roles
CREATE POLICY "Staff can view their own roles"
ON public.restaurant_staff_roles
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- RPC function to create staff invitation
CREATE OR REPLACE FUNCTION public.create_restaurant_staff_invitation(
  p_business_id uuid,
  p_email text,
  p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_profile_id uuid;
  v_existing_profile_id uuid;
  v_invitation_id uuid;
  v_is_authorized boolean := false;
BEGIN
  -- Get inviter's profile
  SELECT id INTO v_inviter_profile_id 
  FROM profiles 
  WHERE user_id = auth.uid();

  IF v_inviter_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if user is authorized (owner or manager)
  SELECT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_profile_id = v_inviter_profile_id
  ) OR EXISTS (
    SELECT 1 FROM restaurant_staff_roles
    WHERE business_id = p_business_id
    AND profile_id = v_inviter_profile_id
    AND role = 'manager'
    AND is_active = true
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to invite staff';
  END IF;

  -- Check if profile already exists
  SELECT id INTO v_existing_profile_id 
  FROM profiles 
  WHERE email = p_email;

  -- Check for existing invitation
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
    true
  )
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$;