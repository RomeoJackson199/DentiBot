-- Fix patient dashboard data issues and ensure all required tables exist

-- Ensure patient_notes table exists with proper structure
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'clinical', 'billing', 'follow_up', 'emergency')),
  title text NOT NULL,
  content text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure medical_records table exists with proper structure
CREATE TABLE IF NOT EXISTS public.medical_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('examination', 'xray', 'lab_result', 'consultation', 'surgery', 'other')),
  title text NOT NULL,
  description text,
  file_url text,
  record_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure prescriptions table exists with proper structure
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  prescribed_date timestamp with time zone DEFAULT now(),
  expiry_date timestamp with time zone,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure treatment_plans table exists with proper structure
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  description text,
  diagnosis text,
  treatment_goals text[],
  procedures text[],
  estimated_cost decimal(10,2),
  estimated_duration text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date timestamp with time zone DEFAULT now(),
  target_completion_date timestamp with time zone,
  actual_completion_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address text;
  END IF;
  
  -- Add emergency_contact column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact text;
  END IF;
  
  -- Add ai_opt_out column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_opt_out') THEN
    ALTER TABLE public.profiles ADD COLUMN ai_opt_out boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient_notes
DROP POLICY IF EXISTS "Patients can view their own notes" ON public.patient_notes;
CREATE POLICY "Patients can view their own notes" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = patient_notes.patient_id
    )
  );

DROP POLICY IF EXISTS "Dentists can view patient notes" ON public.patient_notes;
CREATE POLICY "Dentists can view patient notes" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = patient_notes.dentist_id
    )
  );

-- Create RLS policies for medical_records
DROP POLICY IF EXISTS "Patients can view their own medical records" ON public.medical_records;
CREATE POLICY "Patients can view their own medical records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = medical_records.patient_id
    )
  );

DROP POLICY IF EXISTS "Dentists can view patient medical records" ON public.medical_records;
CREATE POLICY "Dentists can view patient medical records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = medical_records.dentist_id
    )
  );

-- Create RLS policies for prescriptions
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can view their own prescriptions" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = prescriptions.patient_id
    )
  );

DROP POLICY IF EXISTS "Dentists can view patient prescriptions" ON public.prescriptions;
CREATE POLICY "Dentists can view patient prescriptions" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = prescriptions.dentist_id
    )
  );

-- Create RLS policies for treatment_plans
DROP POLICY IF EXISTS "Patients can view their own treatment plans" ON public.treatment_plans;
CREATE POLICY "Patients can view their own treatment plans" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = treatment_plans.patient_id
    )
  );

DROP POLICY IF EXISTS "Dentists can view patient treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can view patient treatment plans" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.dentists d ON p.id = d.profile_id
      WHERE p.user_id = auth.uid() 
      AND d.id = treatment_plans.dentist_id
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_dentist_id ON public.patient_notes(dentist_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_type ON public.patient_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_dentist_id ON public.medical_records(dentist_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON public.medical_records(record_type);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON public.prescriptions(dentist_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_dentist_id ON public.treatment_plans(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

-- Insert some sample data for testing if tables are empty
INSERT INTO public.patient_notes (patient_id, dentist_id, title, content, note_type)
SELECT 
  p.id as patient_id,
  d.id as dentist_id,
  'Initial Consultation' as title,
  'Patient had initial consultation for routine check-up.' as content,
  'clinical' as note_type
FROM public.profiles p
CROSS JOIN public.dentists d
WHERE p.role = 'patient' 
  AND NOT EXISTS (SELECT 1 FROM public.patient_notes WHERE patient_id = p.id)
LIMIT 1;

INSERT INTO public.prescriptions (patient_id, dentist_id, medication_name, dosage, frequency, duration, instructions)
SELECT 
  p.id as patient_id,
  d.id as dentist_id,
  'Amoxicillin' as medication_name,
  '500mg' as dosage,
  'Twice daily' as frequency,
  '7 days' as duration,
  'Take with food' as instructions
FROM public.profiles p
CROSS JOIN public.dentists d
WHERE p.role = 'patient' 
  AND NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE patient_id = p.id)
LIMIT 1;

INSERT INTO public.treatment_plans (patient_id, dentist_id, plan_name, description, status)
SELECT 
  p.id as patient_id,
  d.id as dentist_id,
  'Routine Dental Care' as plan_name,
  'Regular dental check-ups and cleanings' as description,
  'active' as status
FROM public.profiles p
CROSS JOIN public.dentists d
WHERE p.role = 'patient' 
  AND NOT EXISTS (SELECT 1 FROM public.treatment_plans WHERE patient_id = p.id)
LIMIT 1;