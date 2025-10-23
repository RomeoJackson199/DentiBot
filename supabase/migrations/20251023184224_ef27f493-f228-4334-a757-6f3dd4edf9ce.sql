-- Create medical_records table for treatment history
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'consultation',
  title TEXT NOT NULL,
  description TEXT,
  findings TEXT,
  treatment_provided TEXT,
  record_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Patients can view their own medical records
CREATE POLICY "Patients can view their own medical records"
ON public.medical_records
FOR SELECT
USING (patient_id IN (
  SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
));

-- Dentists can view medical records for their patients
CREATE POLICY "Dentists can view their patients' medical records"
ON public.medical_records
FOR SELECT
USING (dentist_id IN (
  SELECT d.id FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

-- Dentists can create medical records for their patients
CREATE POLICY "Dentists can create medical records"
ON public.medical_records
FOR INSERT
WITH CHECK (dentist_id IN (
  SELECT d.id FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

-- Dentists can update medical records they created
CREATE POLICY "Dentists can update their medical records"
ON public.medical_records
FOR UPDATE
USING (dentist_id IN (
  SELECT d.id FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_dentist_id ON public.medical_records(dentist_id);
CREATE INDEX idx_medical_records_date ON public.medical_records(record_date DESC);