-- First, let's check if the user exists and create/update the profile
DO $$
DECLARE
    dentist_user_id uuid;
    dentist_profile_id uuid;
    dentist_id uuid;
    virginia_profile_id uuid;
BEGIN
    -- Check if user exists in auth.users (we can't insert into auth.users directly)
    -- Instead, we'll create a profile assuming the user will sign up with this email
    
    -- For demo purposes, let's create a mock user ID
    dentist_user_id := gen_random_uuid();
    
    -- Insert or update profile for Romeo Jackson as dentist
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        role,
        phone,
        address
    ) VALUES (
        dentist_user_id,
        'Romeojackson199@gmail.com',
        'Romeo',
        'Jackson',
        'dentist',
        '+32 123 456 789',
        'Brussels, Belgium'
    ) 
    ON CONFLICT (email) DO UPDATE SET
        role = 'dentist',
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        address = COALESCE(EXCLUDED.address, profiles.address)
    RETURNING id INTO dentist_profile_id;
    
    -- Create dentist record
    INSERT INTO public.dentists (
        profile_id,
        is_active,
        license_number,
        specialization
    ) VALUES (
        dentist_profile_id,
        true,
        'DDS-BE-2024-001',
        'General Dentistry'
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        is_active = true,
        license_number = COALESCE(EXCLUDED.license_number, dentists.license_number),
        specialization = COALESCE(EXCLUDED.specialization, dentists.specialization)
    RETURNING id INTO dentist_id;
    
    -- Check if Virginia Pauwels exists as a patient, if not create her
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        role,
        phone,
        date_of_birth,
        address,
        medical_history
    ) VALUES (
        gen_random_uuid(),
        'virginia.pauwels@example.com',
        'Virginia',
        'Pauwels',
        'patient',
        '+32 987 654 321',
        '1985-03-15',
        'Ghent, Belgium',
        'No known allergies. Previous dental work: filling in molar 2018.'
    )
    ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name)
    RETURNING id INTO virginia_profile_id;
    
    -- Create some sample appointments between Romeo Jackson and Virginia Pauwels
    INSERT INTO public.appointments (
        patient_id,
        dentist_id,
        appointment_date,
        duration_minutes,
        status,
        reason,
        notes
    ) VALUES 
    (
        virginia_profile_id,
        dentist_id,
        '2024-02-15 10:00:00+00',
        60,
        'completed',
        'Routine cleaning and checkup',
        'Patient showed good oral hygiene. Recommended flossing more regularly.'
    ),
    (
        virginia_profile_id,
        dentist_id,
        '2024-03-20 14:30:00+00',
        90,
        'completed',
        'Cavity filling',
        'Small cavity filled in upper left molar. Patient tolerated procedure well.'
    ),
    (
        virginia_profile_id,
        dentist_id,
        CURRENT_DATE + INTERVAL '7 days' + TIME '09:00:00',
        60,
        'confirmed',
        'Follow-up checkup',
        'Scheduled follow-up to check on recent filling.'
    )
    ON CONFLICT DO NOTHING;
    
    -- Create a medical record for Virginia
    INSERT INTO public.medical_records (
        patient_id,
        dentist_id,
        title,
        description,
        findings,
        recommendations,
        visit_date,
        record_type
    ) VALUES (
        virginia_profile_id,
        dentist_id,
        'Routine Dental Examination - February 2024',
        'Comprehensive oral examination and cleaning',
        'Overall good oral health. Minor plaque buildup on molars. One small cavity detected in upper left molar.',
        'Continue regular brushing twice daily. Increase flossing frequency. Schedule filling appointment for cavity.',
        '2024-02-15',
        'examination'
    ),
    (
        virginia_profile_id,
        dentist_id,
        'Dental Filling Procedure - March 2024',
        'Cavity filling procedure for upper left molar',
        'Successfully filled small cavity in tooth #26. No complications during procedure.',
        'Avoid hard foods for 24 hours. Schedule follow-up in 4-6 weeks.',
        '2024-03-20',
        'treatment'
    )
    ON CONFLICT DO NOTHING;
    
    -- Generate availability slots for Romeo Jackson
    PERFORM public.generate_daily_slots(dentist_id, CURRENT_DATE + i)
    FROM generate_series(0, 30) AS i;
    
    RAISE NOTICE 'Successfully set up Romeo Jackson as dentist with patient Virginia Pauwels';
    RAISE NOTICE 'Dentist ID: %, Profile ID: %', dentist_id, dentist_profile_id;
    RAISE NOTICE 'Virginia Profile ID: %', virginia_profile_id;
    
END $$;