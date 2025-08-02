-- Create demo data for Romeo Jackson as dentist and Virginia Pauwels as patient
DO $$
DECLARE
    dentist_user_id uuid := gen_random_uuid();
    dentist_profile_id uuid;
    dentist_id uuid;
    virginia_user_id uuid := gen_random_uuid();
    virginia_profile_id uuid;
BEGIN
    -- Insert profile for Romeo Jackson as dentist
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
    ) RETURNING id INTO dentist_profile_id;
    
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
    ) RETURNING id INTO dentist_id;
    
    -- Insert profile for Virginia Pauwels as patient
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
        virginia_user_id,
        'virginia.pauwels@example.com',
        'Virginia',
        'Pauwels',
        'patient',
        '+32 987 654 321',
        '1985-03-15',
        'Ghent, Belgium',
        'No known allergies. Previous dental work: filling in molar 2018.'
    ) RETURNING id INTO virginia_profile_id;
    
    -- Create appointments between Romeo Jackson and Virginia Pauwels
    INSERT INTO public.appointments (
        patient_id,
        dentist_id,
        appointment_date,
        duration_minutes,
        status,
        reason,
        notes,
        patient_name
    ) VALUES 
    (
        virginia_profile_id,
        dentist_id,
        '2024-02-15 10:00:00+00',
        60,
        'completed',
        'Routine cleaning and checkup',
        'Patient showed good oral hygiene. Recommended flossing more regularly.',
        'Virginia Pauwels'
    ),
    (
        virginia_profile_id,
        dentist_id,
        '2024-03-20 14:30:00+00',
        90,
        'completed',
        'Cavity filling',
        'Small cavity filled in upper left molar. Patient tolerated procedure well.',
        'Virginia Pauwels'
    ),
    (
        virginia_profile_id,
        dentist_id,
        CURRENT_DATE + INTERVAL '7 days' + TIME '09:00:00',
        60,
        'confirmed',
        'Follow-up checkup',
        'Scheduled follow-up to check on recent filling.',
        'Virginia Pauwels'
    );
    
    -- Create medical records for Virginia
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
    );
    
    -- Generate availability slots for Romeo Jackson (next 30 days)
    PERFORM public.generate_daily_slots(dentist_id, CURRENT_DATE + i)
    FROM generate_series(0, 30) AS i;
    
    -- Set up dentist availability schedule (Monday to Friday, 8 AM to 6 PM)
    INSERT INTO public.dentist_availability (
        dentist_id,
        day_of_week,
        start_time,
        end_time,
        is_available,
        break_start_time,
        break_end_time
    ) VALUES 
    (dentist_id, 1, '08:00', '18:00', true, '12:00', '13:00'), -- Monday
    (dentist_id, 2, '08:00', '18:00', true, '12:00', '13:00'), -- Tuesday
    (dentist_id, 3, '08:00', '18:00', true, '12:00', '13:00'), -- Wednesday
    (dentist_id, 4, '08:00', '18:00', true, '12:00', '13:00'), -- Thursday
    (dentist_id, 5, '08:00', '18:00', true, '12:00', '13:00'); -- Friday
    
    RAISE NOTICE 'Successfully created Romeo Jackson (%) as dentist with patient Virginia Pauwels (%)', dentist_profile_id, virginia_profile_id;
    
END $$;