-- Update handle_new_user function to set healthcare template and assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id uuid;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email, phone)
  VALUES (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  RETURNING id INTO new_profile_id;

  -- Assign patient role by default to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'patient'::app_role)
  ON CONFLICT DO NOTHING;

  -- Only create a business if explicitly requested via metadata
  -- This allows dentists/providers to create businesses through a separate flow
  IF new.raw_user_meta_data->>'create_business' = 'true' THEN
    DECLARE
      new_business_id uuid;
      clinic_name text;
      business_slug text;
    BEGIN
      -- Extract clinic name from metadata, default to user's name
      clinic_name := COALESCE(
        new.raw_user_meta_data->>'clinic_name',
        CONCAT(
          COALESCE(new.raw_user_meta_data->>'first_name', 'Dr.'),
          ' ',
          COALESCE(new.raw_user_meta_data->>'last_name', 'Clinic')
        )
      );

      -- Generate a unique slug from clinic name
      business_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g'));
      business_slug := regexp_replace(business_slug, '^-+|-+$', '', 'g');
      
      -- Ensure slug is unique by appending random suffix if needed
      IF EXISTS (SELECT 1 FROM public.businesses WHERE slug = business_slug) THEN
        business_slug := business_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
      END IF;

      -- Assign admin and provider roles when creating a business
      INSERT INTO public.user_roles (user_id, role)
      VALUES 
        (new.id, 'admin'::app_role),
        (new.id, 'provider'::app_role)
      ON CONFLICT DO NOTHING;

      -- Create the business with healthcare template
      INSERT INTO public.businesses (
        id,
        name,
        slug,
        owner_profile_id,
        tagline,
        primary_color,
        secondary_color,
        currency,
        template_type
      )
      VALUES (
        gen_random_uuid(),
        clinic_name,
        business_slug,
        new_profile_id,
        'Your Practice, Your Way',
        '#0F3D91',
        '#66D2D6',
        'USD',
        'healthcare'
      )
      RETURNING id INTO new_business_id;

      -- Add the owner as a business member with owner role
      INSERT INTO public.business_members (profile_id, business_id, role)
      VALUES (new_profile_id, new_business_id, 'owner');

      -- Set the business as the current session business
      INSERT INTO public.session_business (user_id, business_id)
      VALUES (new.id, new_business_id)
      ON CONFLICT (user_id) DO UPDATE SET business_id = EXCLUDED.business_id;
    END;
  END IF;

  RETURN new;
END;
$$;