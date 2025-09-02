-- Fix remaining database functions that need search_path setting
CREATE OR REPLACE FUNCTION public.update_import_job_progress(p_job_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE import_jobs 
  SET 
    processed_rows = (
      SELECT COUNT(*) FROM import_job_items 
      WHERE job_id = p_job_id AND status != 'pending'
    ),
    successful_rows = (
      SELECT COUNT(*) FROM import_job_items 
      WHERE job_id = p_job_id AND status = 'success'
    ),
    failed_rows = (
      SELECT COUNT(*) FROM import_job_items 
      WHERE job_id = p_job_id AND status = 'failed'
    ),
    updated_at = now()
  WHERE id = p_job_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'dentist' THEN
    INSERT INTO dentists (profile_id, is_active)
    SELECT id, true 
    FROM profiles 
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_appointment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  patient_user_id UUID;
  dentist_name TEXT;
BEGIN
  -- Only proceed if appointment status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get patient user_id
    SELECT user_id INTO patient_user_id
    FROM profiles WHERE id = NEW.patient_id;
    
    -- Get dentist name  
    SELECT CONCAT(p.first_name, ' ', p.last_name) INTO dentist_name
    FROM profiles p
    JOIN dentists d ON d.profile_id = p.id
    WHERE d.id = NEW.dentist_id;
    
    -- Create medical record entry for completed appointment
    INSERT INTO medical_records (
      patient_id,
      dentist_id,
      appointment_id,
      record_type,
      title,
      description,
      findings,
      recommendations,
      record_date
    ) VALUES (
      NEW.patient_id,
      NEW.dentist_id,
      NEW.id,
      'consultation',
      'Appointment Completed - ' || COALESCE(NEW.reason, 'General Consultation'),
      COALESCE(NEW.consultation_notes, 'Appointment completed successfully.'),
      COALESCE(NEW.notes, ''),
      'Follow up as needed.',
      NEW.treatment_completed_at::date
    );
    
    -- Create notification for patient
    INSERT INTO notifications (
      user_id,
      patient_id,
      dentist_id,
      type,
      title,
      message,
      priority,
      action_url,
      action_label,
      metadata
    ) VALUES (
      patient_user_id,
      NEW.patient_id,
      NEW.dentist_id,
      'appointment_completed',
      'Appointment Completed',
      'Dr. ' || COALESCE(dentist_name, 'Your dentist') || ' has completed your appointment. Click to view details and records.',
      'high',
      '/dashboard?tab=appointments&appointmentId=' || NEW.id::text,
      'View Appointment Details',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'completion_date', NEW.treatment_completed_at,
        'reason', NEW.reason
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;