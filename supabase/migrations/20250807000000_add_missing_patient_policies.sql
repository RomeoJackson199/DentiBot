-- Add missing INSERT and UPDATE policies for patients to access their medical data

-- Add INSERT policies for patients on patient_notes
DROP POLICY IF EXISTS "Patients can create their own notes" ON public.patient_notes;
CREATE POLICY "Patients can create their own notes" ON public.patient_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

-- Add UPDATE policies for patients on patient_notes
DROP POLICY IF EXISTS "Patients can update their own notes" ON public.patient_notes;
CREATE POLICY "Patients can update their own notes" ON public.patient_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

-- Add INSERT policies for dentists on patient_notes
DROP POLICY IF EXISTS "Dentists can create patient notes" ON public.patient_notes;
CREATE POLICY "Dentists can create patient notes" ON public.patient_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = patient_notes.dentist_id
    )
  );

-- Add UPDATE policies for dentists on patient_notes
DROP POLICY IF EXISTS "Dentists can update patient notes" ON public.patient_notes;
CREATE POLICY "Dentists can update patient notes" ON public.patient_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = patient_notes.dentist_id
    )
  );

-- Add INSERT policies for dentists on medical_records
DROP POLICY IF EXISTS "Dentists can create patient medical records" ON public.medical_records;
CREATE POLICY "Dentists can create patient medical records" ON public.medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = medical_records.dentist_id
    )
  );

-- Add UPDATE policies for dentists on medical_records
DROP POLICY IF EXISTS "Dentists can update patient medical records" ON public.medical_records;
CREATE POLICY "Dentists can update patient medical records" ON public.medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = medical_records.dentist_id
    )
  );

-- Add INSERT policies for dentists on prescriptions
DROP POLICY IF EXISTS "Dentists can create patient prescriptions" ON public.prescriptions;
CREATE POLICY "Dentists can create patient prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = prescriptions.dentist_id
    )
  );

-- Add UPDATE policies for dentists on prescriptions
DROP POLICY IF EXISTS "Dentists can update patient prescriptions" ON public.prescriptions;
CREATE POLICY "Dentists can update patient prescriptions" ON public.prescriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = prescriptions.dentist_id
    )
  );

-- Add INSERT policies for dentists on treatment_plans
DROP POLICY IF EXISTS "Dentists can create patient treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can create patient treatment plans" ON public.treatment_plans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = treatment_plans.dentist_id
    )
  );

-- Add UPDATE policies for dentists on treatment_plans
DROP POLICY IF EXISTS "Dentists can update patient treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can update patient treatment plans" ON public.treatment_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = treatment_plans.dentist_id
    )
  );

-- Add DELETE policies for dentists on patient_notes
DROP POLICY IF EXISTS "Dentists can delete patient notes" ON public.patient_notes;
CREATE POLICY "Dentists can delete patient notes" ON public.patient_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = patient_notes.dentist_id
    )
  );

-- Add DELETE policies for dentists on medical_records
DROP POLICY IF EXISTS "Dentists can delete patient medical records" ON public.medical_records;
CREATE POLICY "Dentists can delete patient medical records" ON public.medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = medical_records.dentist_id
    )
  );

-- Add DELETE policies for dentists on prescriptions
DROP POLICY IF EXISTS "Dentists can delete patient prescriptions" ON public.prescriptions;
CREATE POLICY "Dentists can delete patient prescriptions" ON public.prescriptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = prescriptions.dentist_id
    )
  );

-- Add DELETE policies for dentists on treatment_plans
DROP POLICY IF EXISTS "Dentists can delete patient treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can delete patient treatment plans" ON public.treatment_plans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = treatment_plans.dentist_id
    )
  );

-- Add DELETE policies for patients on their own notes
DROP POLICY IF EXISTS "Patients can delete their own notes" ON public.patient_notes;
CREATE POLICY "Patients can delete their own notes" ON public.patient_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );