-- Setup multi-tenancy test: Create second clinic for John

DO $$
DECLARE
  v_john_dentist_id uuid;
  v_smile_business_id uuid := 'b9876543-1234-5678-9abc-def012345678'::uuid;
BEGIN
  -- 1. Create new business
  INSERT INTO public.businesses (id, name, slug, owner_profile_id, tagline, specialty_type)
  VALUES (
    v_smile_business_id,
    'Smile Dental Clinic',
    'smile-dental',
    '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid,
    'Your smile is our priority',
    'dentist'
  )
  ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    owner_profile_id = EXCLUDED.owner_profile_id;

  -- 2. Delete John's patient data
  DELETE FROM public.appointments WHERE patient_id = '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid;
  DELETE FROM public.medical_records WHERE patient_id = '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid;
  DELETE FROM public.treatment_plans WHERE patient_id = '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid;

  -- 3. Check if John is already a dentist, if not create
  SELECT id INTO v_john_dentist_id FROM public.dentists WHERE profile_id = '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid;
  
  IF v_john_dentist_id IS NULL THEN
    v_john_dentist_id := 'de234567-89ab-cdef-0123-456789abcdef'::uuid;
    INSERT INTO public.dentists (id, profile_id, first_name, last_name, email, specialization, is_active)
    VALUES (
      v_john_dentist_id,
      '2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid,
      'John',
      'Jackson',
      'romeojulianjackson@gmail.com',
      'General Dentistry',
      true
    );
  END IF;

  -- 4. Give provider role
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('12ebece7-6ba7-480e-934a-aa9c9e246d0d'::uuid, 'provider'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- 5. Add business memberships
  INSERT INTO public.business_members (profile_id, business_id, role)
  VALUES 
    ('a3ce9334-3da6-4487-87ec-b5ae67df0467'::uuid, '8f03f32b-6adc-4df0-9f22-14312499748a'::uuid, 'owner'),
    ('2f7646a7-ae3a-4edc-8ec5-0120671b7433'::uuid, v_smile_business_id, 'owner')
  ON CONFLICT (profile_id, business_id) DO UPDATE SET role = EXCLUDED.role;
  
END $$;