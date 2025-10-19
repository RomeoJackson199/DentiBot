-- Step 2: Convert customer to patient and fix role assignment

-- 1. Backfill customer -> patient
UPDATE public.user_roles 
SET role = 'patient'::public.app_role 
WHERE role = 'customer'::public.app_role;

-- 2. Remove erroneous provider role from romeojackson199@gmail.com (should be patient)
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'romeojackson199@gmail.com'
) AND role = 'provider'::public.app_role;

-- 3. Ensure romeojackson199@gmail.com has patient role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'patient'::public.app_role
FROM auth.users 
WHERE email = 'romeojackson199@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Replace assign_default_customer_role with assign_default_patient_role
DROP FUNCTION IF EXISTS public.assign_default_customer_role() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_default_patient_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.user_id, 'patient'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- 5. Create trigger to auto-assign patient role on profile creation
DROP TRIGGER IF EXISTS on_profile_created_assign_patient_role ON public.profiles;

CREATE TRIGGER on_profile_created_assign_patient_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_default_patient_role();

-- 6. Create helper function to check clinic registration
CREATE OR REPLACE FUNCTION public.check_clinic_registration(business_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_provider_id uuid;
  v_is_active boolean;
  v_business_exists boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('registered', false, 'provider_active', false, 'message', 'Not authenticated');
  END IF;
  
  SELECT EXISTS(SELECT 1 FROM businesses WHERE slug = business_slug) INTO v_business_exists;
  IF NOT v_business_exists THEN
    RETURN jsonb_build_object('registered', false, 'provider_active', false, 'message', 'Clinic not found');
  END IF;
  
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_user_id;
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('registered', false, 'provider_active', false, 'message', 'Profile not found');
  END IF;
  
  SELECT id, is_active INTO v_provider_id, v_is_active FROM providers WHERE profile_id = v_profile_id;
  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('registered', false, 'provider_active', false, 'message', 'Not registered as provider');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM provider_business_map pbm
    JOIN businesses b ON pbm.business_id = b.id
    WHERE pbm.provider_id = v_provider_id AND b.slug = business_slug
  ) THEN
    RETURN jsonb_build_object('registered', true, 'provider_active', v_is_active, 
      'message', CASE WHEN v_is_active THEN 'Active at clinic' ELSE 'Inactive at clinic' END);
  ELSE
    RETURN jsonb_build_object('registered', false, 'provider_active', false, 'message', 'Not at this clinic');
  END IF;
END;
$$;