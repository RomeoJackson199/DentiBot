-- Fix security warnings: add search_path to security definer functions

-- Update security definer functions to include search_path
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_dentist_for_patient(patient_profile_id uuid)
RETURNS boolean 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles dentist_profile ON dentist_profile.id = d.profile_id
    WHERE a.patient_id = patient_profile_id 
    AND dentist_profile.user_id = auth.uid()
    AND a.appointment_date >= (now() - interval '30 days')
  );
$$;