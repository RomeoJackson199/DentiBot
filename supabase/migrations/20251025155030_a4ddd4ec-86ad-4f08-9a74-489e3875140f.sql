-- Fix RLS policies for appointment booking
-- Drop the restrictive patient insert policy
DROP POLICY IF EXISTS "Patients can create their own appointments" ON appointments;

-- Create a more permissive policy for patients booking appointments
CREATE POLICY "Patients can create their own appointments" 
ON appointments 
FOR INSERT 
WITH CHECK (
  -- Patient must be booking for themselves
  patient_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
  -- Dentist must exist and be active
  AND EXISTS (
    SELECT 1 
    FROM dentists d 
    WHERE d.id = appointments.dentist_id 
    AND d.is_active = true
  )
  -- Business must exist
  AND EXISTS (
    SELECT 1 
    FROM businesses b 
    WHERE b.id = appointments.business_id
  )
);

-- Also ensure patients can view their appointments without business context
DROP POLICY IF EXISTS "Patients can view their own appointments" ON appointments;

CREATE POLICY "Patients can view their own appointments" 
ON appointments 
FOR SELECT 
USING (
  patient_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);