-- Fix RLS policies for patient management tables
-- This migration addresses issues with saving data in patient management

-- Enable RLS on all patient management tables
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Dentists can create patient prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Dentists can update patient prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Dentists can delete patient prescriptions" ON public.prescriptions;

DROP POLICY IF EXISTS "Dentists can create patient treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Dentists can update patient treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Dentists can delete patient treatment plans" ON public.treatment_plans;

DROP POLICY IF EXISTS "Dentists can create patient notes" ON public.patient_notes;
DROP POLICY IF EXISTS "Dentists can update patient notes" ON public.patient_notes;
DROP POLICY IF EXISTS "Dentists can delete patient notes" ON public.patient_notes;

DROP POLICY IF EXISTS "Dentists can create patient medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Dentists can update patient medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Dentists can delete patient medical records" ON public.medical_records;

-- Create simplified policies that work with the current authentication setup
-- Prescriptions policies
CREATE POLICY "Dentists can manage prescriptions" ON public.prescriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = prescriptions.dentist_id
    )
  );

-- Treatment plans policies
CREATE POLICY "Dentists can manage treatment plans" ON public.treatment_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = treatment_plans.dentist_id
    )
  );

-- Patient notes policies
CREATE POLICY "Dentists can manage patient notes" ON public.patient_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = patient_notes.dentist_id
    )
  );

-- Medical records policies
CREATE POLICY "Dentists can manage medical records" ON public.medical_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = medical_records.dentist_id
    )
  );

-- Add policies for patients to access their own data
CREATE POLICY "Patients can view their own prescriptions" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = prescriptions.patient_id
    )
  );

CREATE POLICY "Patients can view their own treatment plans" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = treatment_plans.patient_id
    )
  );

CREATE POLICY "Patients can view their own notes" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

CREATE POLICY "Patients can view their own medical records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = medical_records.patient_id
    )
  );