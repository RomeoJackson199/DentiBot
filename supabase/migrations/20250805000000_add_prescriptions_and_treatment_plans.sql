-- Add prescriptions table
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

-- Add treatment plans table
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

-- Add treatment plan procedures table
CREATE TABLE IF NOT EXISTS public.treatment_procedures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_plan_id uuid NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  procedure_name text NOT NULL,
  description text,
  cost decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_date timestamp with time zone,
  completed_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add patient medical records table
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

-- Add patient notes table (enhanced)
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

-- Add appointment follow-ups table
CREATE TABLE IF NOT EXISTS public.appointment_follow_ups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  follow_up_type text NOT NULL CHECK (follow_up_type IN ('phone_call', 'email', 'sms', 'in_person')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  scheduled_date timestamp with time zone,
  completed_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add triggers for updated_at
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_procedures_updated_at
  BEFORE UPDATE ON public.treatment_procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_follow_ups_updated_at
  BEFORE UPDATE ON public.appointment_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' prescriptions" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = prescriptions.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create prescriptions for their patients" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = prescriptions.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their patients' prescriptions" ON public.prescriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = prescriptions.dentist_id AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for treatment plans
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' treatment plans" ON public.treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = treatment_plans.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create treatment plans for their patients" ON public.treatment_plans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = treatment_plans.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their patients' treatment plans" ON public.treatment_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = treatment_plans.dentist_id AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for treatment procedures
ALTER TABLE public.treatment_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' treatment procedures" ON public.treatment_procedures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.treatment_plans tp
      JOIN public.dentists d ON d.id = tp.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE tp.id = treatment_procedures.treatment_plan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create treatment procedures" ON public.treatment_procedures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatment_plans tp
      JOIN public.dentists d ON d.id = tp.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE tp.id = treatment_procedures.treatment_plan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update treatment procedures" ON public.treatment_procedures
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.treatment_plans tp
      JOIN public.dentists d ON d.id = tp.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE tp.id = treatment_procedures.treatment_plan_id AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for medical records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' medical records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = medical_records.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create medical records for their patients" ON public.medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = medical_records.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their patients' medical records" ON public.medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = medical_records.dentist_id AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for patient notes
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' notes" ON public.patient_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = patient_notes.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create notes for their patients" ON public.patient_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = patient_notes.dentist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their patients' notes" ON public.patient_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = patient_notes.dentist_id AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for appointment follow-ups
ALTER TABLE public.appointment_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their patients' follow-ups" ON public.appointment_follow_ups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.dentists d ON d.id = a.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE a.id = appointment_follow_ups.appointment_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can create follow-ups for their patients" ON public.appointment_follow_ups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.dentists d ON d.id = a.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE a.id = appointment_follow_ups.appointment_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their patients' follow-ups" ON public.appointment_follow_ups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.dentists d ON d.id = a.dentist_id
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE a.id = appointment_follow_ups.appointment_id AND p.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON public.prescriptions(dentist_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_dentist_id ON public.treatment_plans(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

CREATE INDEX IF NOT EXISTS idx_treatment_procedures_plan_id ON public.treatment_procedures(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_procedures_status ON public.treatment_procedures(status);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_dentist_id ON public.medical_records(dentist_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON public.medical_records(record_type);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_dentist_id ON public.patient_notes(dentist_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_type ON public.patient_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_appointment_follow_ups_appointment_id ON public.appointment_follow_ups(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_follow_ups_status ON public.appointment_follow_ups(status);