-- Fix patient INSERT policies for all medical data tables
-- This migration adds proper INSERT policies for patients

-- Enable RLS on all tables (in case they were disabled)
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

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

-- Add INSERT policies for patients on medical_records
DROP POLICY IF EXISTS "Patients can create their own medical records" ON public.medical_records;
CREATE POLICY "Patients can create their own medical records" ON public.medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = medical_records.patient_id
    )
  );

-- Add INSERT policies for patients on prescriptions
DROP POLICY IF EXISTS "Patients can create their own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can create their own prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = prescriptions.patient_id
    )
  );

-- Add INSERT policies for patients on treatment_plans
DROP POLICY IF EXISTS "Patients can create their own treatment plans" ON public.treatment_plans;
CREATE POLICY "Patients can create their own treatment plans" ON public.treatment_plans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = treatment_plans.patient_id
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

-- Add UPDATE policies for patients on medical_records
DROP POLICY IF EXISTS "Patients can update their own medical records" ON public.medical_records;
CREATE POLICY "Patients can update their own medical records" ON public.medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = medical_records.patient_id
    )
  );

-- Add UPDATE policies for patients on prescriptions
DROP POLICY IF EXISTS "Patients can update their own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can update their own prescriptions" ON public.prescriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = prescriptions.patient_id
    )
  );

-- Add UPDATE policies for patients on treatment_plans
DROP POLICY IF EXISTS "Patients can update their own treatment plans" ON public.treatment_plans;
CREATE POLICY "Patients can update their own treatment plans" ON public.treatment_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = treatment_plans.patient_id
    )
  );

-- Add DELETE policies for patients on patient_notes
DROP POLICY IF EXISTS "Patients can delete their own notes" ON public.patient_notes;
CREATE POLICY "Patients can delete their own notes" ON public.patient_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

-- Add DELETE policies for patients on medical_records
DROP POLICY IF EXISTS "Patients can delete their own medical records" ON public.medical_records;
CREATE POLICY "Patients can delete their own medical records" ON public.medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = medical_records.patient_id
    )
  );

-- Add DELETE policies for patients on prescriptions
DROP POLICY IF EXISTS "Patients can delete their own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can delete their own prescriptions" ON public.prescriptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = prescriptions.patient_id
    )
  );

-- Add DELETE policies for patients on treatment_plans
DROP POLICY IF EXISTS "Patients can delete their own treatment plans" ON public.treatment_plans;
CREATE POLICY "Patients can delete their own treatment plans" ON public.treatment_plans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = treatment_plans.patient_id
    )
  );