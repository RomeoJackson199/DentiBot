-- Fix infinite recursion in profiles RLS policies

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing dentist profiles" ON public.profiles;
DROP POLICY IF EXISTS "Dentists can view scheduled patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dentist_for_patient(patient_profile_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles dentist_profile ON dentist_profile.id = d.profile_id
    WHERE a.patient_id = patient_profile_id 
    AND dentist_profile.user_id = auth.uid()
    AND a.appointment_date >= (now() - interval '30 days')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view dentist profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'dentist'::user_role);

CREATE POLICY "Dentists can view their patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_dentist_for_patient(id));

CREATE POLICY "Allow anonymous profile creation"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);