-- Split the dentists between the two clinics
-- romeojackson199@gmail.com -> Caberu
-- romeojulianjackson@gmail.com -> Smile Dental Clinic

DO $$
DECLARE
  v_profile_id_1 uuid;
  v_profile_id_2 uuid;
  v_dentist_id_1 uuid;
  v_dentist_id_2 uuid;
  v_caberu_business_id uuid := 'b9876543-1234-5678-9abc-def012345678';
  v_smile_business_id uuid := '4dbd571f-58dc-4f36-9bf5-433ce708d4da';
BEGIN
  -- Get profile IDs for the emails
  SELECT p.id INTO v_profile_id_1
  FROM public.profiles p
  WHERE p.email = 'romeojackson199@gmail.com';
  
  SELECT p.id INTO v_profile_id_2
  FROM public.profiles p
  WHERE p.email = 'romeojulianjackson@gmail.com';
  
  -- First, remove any existing business memberships for these profiles
  IF v_profile_id_1 IS NOT NULL THEN
    DELETE FROM public.business_members WHERE profile_id = v_profile_id_1;
  END IF;
  
  IF v_profile_id_2 IS NOT NULL THEN
    DELETE FROM public.business_members WHERE profile_id = v_profile_id_2;
  END IF;
  
  -- Add romeojackson199@gmail.com to Caberu
  IF v_profile_id_1 IS NOT NULL THEN
    -- Check if dentist record exists
    SELECT id INTO v_dentist_id_1 FROM public.dentists WHERE profile_id = v_profile_id_1;
    
    IF v_dentist_id_1 IS NULL THEN
      -- Create dentist record
      INSERT INTO public.dentists (
        profile_id, 
        first_name, 
        last_name, 
        email, 
        specialization,
        is_active
      )
      SELECT 
        p.id,
        COALESCE(p.first_name, 'Romeo'),
        COALESCE(p.last_name, 'Jackson'),
        p.email,
        'General Dentistry',
        true
      FROM public.profiles p
      WHERE p.id = v_profile_id_1
      RETURNING id INTO v_dentist_id_1;
    ELSE
      -- Update existing dentist record
      UPDATE public.dentists 
      SET is_active = true, updated_at = now()
      WHERE id = v_dentist_id_1;
    END IF;
    
    -- Add to Caberu business
    INSERT INTO public.business_members (
      business_id,
      profile_id,
      role
    ) VALUES (
      v_caberu_business_id,
      v_profile_id_1,
      'dentist'
    );
    
    -- Assign provider role
    INSERT INTO public.user_roles (user_id, role)
    SELECT p.user_id, 'provider'::public.app_role
    FROM public.profiles p
    WHERE p.id = v_profile_id_1
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Added romeojackson199@gmail.com to Caberu';
  ELSE
    RAISE NOTICE 'Profile not found for romeojackson199@gmail.com - user needs to sign up first';
  END IF;
  
  -- Add romeojulianjackson@gmail.com to Smile Dental Clinic
  IF v_profile_id_2 IS NOT NULL THEN
    -- Check if dentist record exists
    SELECT id INTO v_dentist_id_2 FROM public.dentists WHERE profile_id = v_profile_id_2;
    
    IF v_dentist_id_2 IS NULL THEN
      -- Create dentist record
      INSERT INTO public.dentists (
        profile_id, 
        first_name, 
        last_name, 
        email, 
        specialization,
        is_active
      )
      SELECT 
        p.id,
        COALESCE(p.first_name, 'Romeo Julian'),
        COALESCE(p.last_name, 'Jackson'),
        p.email,
        'General Dentistry',
        true
      FROM public.profiles p
      WHERE p.id = v_profile_id_2
      RETURNING id INTO v_dentist_id_2;
    ELSE
      -- Update existing dentist record
      UPDATE public.dentists 
      SET is_active = true, updated_at = now()
      WHERE id = v_dentist_id_2;
    END IF;
    
    -- Add to Smile Dental business
    INSERT INTO public.business_members (
      business_id,
      profile_id,
      role
    ) VALUES (
      v_smile_business_id,
      v_profile_id_2,
      'dentist'
    );
    
    -- Assign provider role
    INSERT INTO public.user_roles (user_id, role)
    SELECT p.user_id, 'provider'::public.app_role
    FROM public.profiles p
    WHERE p.id = v_profile_id_2
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Added romeojulianjackson@gmail.com to Smile Dental Clinic';
  ELSE
    RAISE NOTICE 'Profile not found for romeojulianjackson@gmail.com - user needs to sign up first';
  END IF;
  
END $$;