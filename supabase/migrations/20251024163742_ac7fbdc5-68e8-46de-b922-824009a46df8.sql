-- Force delete the Testing business and all related data
DO $$
DECLARE
  v_testing_business_id uuid := '8f03f32b-6adc-4df0-9f22-14312499748a';
BEGIN
  -- Delete all business members
  DELETE FROM public.business_members 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all appointments
  DELETE FROM public.appointments 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all appointment slots
  DELETE FROM public.appointment_slots 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all medical records
  DELETE FROM public.medical_records 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all treatment plans
  DELETE FROM public.treatment_plans 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all payment requests
  DELETE FROM public.payment_requests 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all dentist availability
  DELETE FROM public.dentist_availability 
  WHERE business_id = v_testing_business_id;
  
  -- Delete all dentist vacation days
  DELETE FROM public.dentist_vacation_days 
  WHERE business_id = v_testing_business_id;
  
  -- Finally, delete the business itself
  DELETE FROM public.businesses 
  WHERE id = v_testing_business_id;
  
  RAISE NOTICE 'Testing business and all related data deleted';
END $$;