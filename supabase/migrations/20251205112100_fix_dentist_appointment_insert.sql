-- Add policy to allow dentists to create appointments for their patients
-- This fixes the 403 Forbidden error when dentists try to book appointments

-- First, check if policy exists and drop it if so
DROP POLICY IF EXISTS "Dentists can create appointments for patients" ON public.appointments;

-- Create policy allowing dentists to insert appointments
CREATE POLICY "Dentists can create appointments for patients"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- The user must be the dentist creating the appointment
  EXISTS (
    SELECT 1 
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = appointments.dentist_id 
    AND p.user_id = auth.uid()
  )
);

-- Also ensure dentists can update their own appointments
DROP POLICY IF EXISTS "Dentists can update their appointments" ON public.appointments;

CREATE POLICY "Dentists can update their appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = appointments.dentist_id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = appointments.dentist_id 
    AND p.user_id = auth.uid()
  )
);

-- And delete their own appointments
DROP POLICY IF EXISTS "Dentists can delete their appointments" ON public.appointments;

CREATE POLICY "Dentists can delete their appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = appointments.dentist_id 
    AND p.user_id = auth.uid()
  )
);
