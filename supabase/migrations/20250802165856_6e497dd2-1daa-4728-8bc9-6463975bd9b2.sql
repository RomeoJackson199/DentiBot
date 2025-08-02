-- Update RLS policies for profiles table to allow dentists to view their patients
-- First, let's check what we have and then add the missing policy

-- Add policy to allow dentists to view their patients' profiles
CREATE POLICY "Dentists can view their patients' profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles dentist_profile ON dentist_profile.id = d.profile_id
    WHERE a.patient_id = profiles.id 
    AND dentist_profile.user_id = auth.uid()
  )
);