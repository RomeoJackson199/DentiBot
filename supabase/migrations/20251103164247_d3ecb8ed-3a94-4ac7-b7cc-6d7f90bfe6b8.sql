-- Create restaurant staff codes table
CREATE TABLE public.restaurant_staff_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('waiter', 'cook', 'host', 'manager')),
  code text NOT NULL UNIQUE,
  created_by_profile_id uuid NOT NULL REFERENCES public.profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, role)
);

-- Enable RLS
ALTER TABLE public.restaurant_staff_codes ENABLE ROW LEVEL SECURITY;

-- Business owners/managers can manage codes
CREATE POLICY "Business owners can manage staff codes"
ON public.restaurant_staff_codes
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
  OR has_restaurant_role(
    (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
    business_id,
    'manager'
  )
);

-- Anyone can view codes (needed to join with a code)
CREATE POLICY "Anyone can view active codes"
ON public.restaurant_staff_codes
FOR SELECT
USING (is_active = true);

-- Function to join staff with code
CREATE OR REPLACE FUNCTION public.join_restaurant_staff_with_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_code_record record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile
  SELECT id INTO v_profile_id 
  FROM public.profiles 
  WHERE user_id = v_user_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Get code details
  SELECT * INTO v_code_record
  FROM public.restaurant_staff_codes
  WHERE code = p_code AND is_active = true;

  IF v_code_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive code';
  END IF;

  -- Check if already staff
  IF EXISTS (
    SELECT 1 FROM public.restaurant_staff_roles
    WHERE business_id = v_code_record.business_id
    AND profile_id = v_profile_id
  ) THEN
    RAISE EXCEPTION 'Already a staff member at this business';
  END IF;

  -- Add as staff member
  INSERT INTO public.restaurant_staff_roles (
    business_id,
    profile_id,
    role,
    is_active
  ) VALUES (
    v_code_record.business_id,
    v_profile_id,
    v_code_record.role,
    true
  );

  RETURN jsonb_build_object(
    'success', true,
    'business_id', v_code_record.business_id,
    'role', v_code_record.role
  );
END;
$$;