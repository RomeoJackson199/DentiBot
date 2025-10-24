-- Fix the RLS policy for patient appointment creation
-- The current policy has a bug where it checks pb.business_id = pb.business_id (always true)
-- instead of validating appointments.business_id = pb.business_id

DROP POLICY IF EXISTS "Patients can create their own appointments" ON public.appointments;

CREATE POLICY "Patients can create their own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be inserting their own profile as patient
  patient_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
  AND
  -- The dentist must be linked to the business being used
  EXISTS (
    SELECT 1
    FROM dentists d
    JOIN provider_business_map pb ON pb.provider_id = d.profile_id
    WHERE d.id = appointments.dentist_id
      AND pb.business_id = appointments.business_id
  )
);