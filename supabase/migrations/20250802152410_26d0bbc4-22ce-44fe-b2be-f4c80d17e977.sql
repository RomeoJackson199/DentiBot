-- Add RLS policy to allow dentists to view patient profiles they have appointments with
CREATE POLICY "Dentists can view patient profiles they have appointments with" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND a.patient_id = profiles.id
  )
  OR 
  EXISTS (
    SELECT 1 
    FROM medical_records mr
    JOIN dentists d ON d.id = mr.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND mr.patient_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM treatment_plans tp
    JOIN dentists d ON d.id = tp.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND tp.patient_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM notes n
    JOIN dentists d ON d.id = n.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() 
    AND n.patient_id = profiles.id
  )
);