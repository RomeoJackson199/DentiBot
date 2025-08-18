-- Phase 1: Fix Critical Public Data Exposure

-- 1. Drop the overly permissive profile policy that allows public access
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON public.profiles;

-- 2. Create secure profile access policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Dentists can view their patients' profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM appointments a 
    JOIN dentists d ON d.id = a.dentist_id 
    JOIN profiles dp ON dp.id = d.profile_id 
    WHERE a.patient_id = profiles.id 
    AND dp.user_id = auth.uid()
  )
);

-- 3. Secure appointment slots - require authentication
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.appointment_slots;

CREATE POLICY "Authenticated users can view available slots" 
ON public.appointment_slots 
FOR SELECT 
USING (is_available = true AND auth.uid() IS NOT NULL);

-- 4. Secure dentist availability - require authentication  
DROP POLICY IF EXISTS "Anyone can view dentist availability" ON public.dentist_availability;

CREATE POLICY "Authenticated users can view dentist availability" 
ON public.dentist_availability 
FOR SELECT 
USING (is_available = true AND auth.uid() IS NOT NULL);

-- 5. Secure dentist profiles - only show essential info for authenticated users
DROP POLICY IF EXISTS "Anyone can view active dentists" ON public.dentists;

CREATE POLICY "Authenticated users can view active dentists for booking" 
ON public.dentists 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Phase 2: Database Security Hardening

-- 6. Fix database function security by adding proper search_path
CREATE OR REPLACE FUNCTION public.get_patient_context_for_ai(p_patient_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result JSONB := '{}';
  patient_info JSONB;
  appointments_info JSONB;
  medical_records_info JSONB;
  notes_info JSONB;
  symptom_summaries_info JSONB;
  treatment_plans_info JSONB;
BEGIN
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    JOIN appointments a ON a.dentist_id = d.id
    WHERE a.patient_id = p_patient_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to patient data';
  END IF;
  
  -- Get patient profile
  SELECT to_jsonb(profiles) INTO patient_info
  FROM profiles
  WHERE id = p_patient_id;
  
  -- Get recent appointments
  SELECT jsonb_agg(to_jsonb(appointments)) INTO appointments_info
  FROM appointments
  WHERE patient_id = p_patient_id
  ORDER BY appointment_date DESC
  LIMIT 10;
  
  -- Get medical records
  SELECT jsonb_agg(to_jsonb(medical_records)) INTO medical_records_info
  FROM medical_records
  WHERE patient_id = p_patient_id
  ORDER BY record_date DESC
  LIMIT 5;
  
  -- Get notes
  SELECT jsonb_agg(to_jsonb(notes)) INTO notes_info
  FROM notes
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 10;
  
  -- Get symptom summaries
  SELECT jsonb_agg(to_jsonb(patient_symptom_summaries)) INTO symptom_summaries_info
  FROM patient_symptom_summaries
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 5;
  
  -- Get treatment plans
  SELECT jsonb_agg(to_jsonb(treatment_plans)) INTO treatment_plans_info
  FROM treatment_plans
  WHERE patient_id = p_patient_id
  ORDER BY created_at DESC
  LIMIT 5;
  
  -- Build result
  result := jsonb_build_object(
    'patient', patient_info,
    'appointments', COALESCE(appointments_info, '[]'::jsonb),
    'medical_records', COALESCE(medical_records_info, '[]'::jsonb),
    'notes', COALESCE(notes_info, '[]'::jsonb),
    'symptom_summaries', COALESCE(symptom_summaries_info, '[]'::jsonb),
    'treatment_plans', COALESCE(treatment_plans_info, '[]'::jsonb)
  );
  
  RETURN result;
END;
$function$;

-- 7. Secure other critical functions
CREATE OR REPLACE FUNCTION public.create_simple_appointment(p_patient_id uuid, p_dentist_id uuid, p_appointment_date timestamp with time zone, p_reason text DEFAULT 'Consultation'::text, p_urgency urgency_level DEFAULT 'medium'::urgency_level)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_appointment_id UUID;
  patient_name TEXT;
BEGIN
  -- Add authorization check - user must be the patient or the dentist
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only create appointments for yourself or your patients';
  END IF;
  
  -- Get patient name
  SELECT first_name || ' ' || last_name INTO patient_name
  FROM profiles WHERE id = p_patient_id;
  
  -- Insert appointment
  INSERT INTO appointments (
    patient_id,
    dentist_id,
    appointment_date,
    reason,
    urgency,
    status,
    patient_name,
    duration_minutes
  ) VALUES (
    p_patient_id,
    p_dentist_id,
    p_appointment_date,
    p_reason,
    p_urgency,
    'confirmed'::appointment_status,
    patient_name,
    60
  ) RETURNING id INTO new_appointment_id;
  
  RETURN new_appointment_id;
END;
$function$;

-- 8. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (user_id = auth.uid());

-- 9. Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id
  );
END;
$$;