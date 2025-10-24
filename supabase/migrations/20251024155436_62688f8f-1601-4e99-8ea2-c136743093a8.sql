-- Fix patient insert policy for appointments using secure membership check to avoid RLS visibility issues
DROP POLICY IF EXISTS "Patients can create their own appointments" ON public.appointments;

CREATE POLICY "Patients can create their own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Patient can only create for themselves
  patient_id IN (
    SELECT p.id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
  AND
  -- Dentist must be a member of the specified business (checked via SECURITY DEFINER function)
  EXISTS (
    SELECT 1
    FROM public.dentists d
    WHERE d.id = appointments.dentist_id
      AND public.is_business_member(d.profile_id, appointments.business_id)
  )
);
