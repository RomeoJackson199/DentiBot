-- Create appointment outcomes table
CREATE TABLE IF NOT EXISTS public.appointment_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('successful','partial','cancelled','complication')),
  notes text,
  pain_score integer CHECK (pain_score >= 0 AND pain_score <= 10),
  anesthesia_used boolean DEFAULT false,
  anesthesia_dose text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can manage outcomes for own appointments"
ON public.appointment_outcomes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE a.id = appointment_outcomes.appointment_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their appointment outcomes"
ON public.appointment_outcomes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.profiles p ON p.id = a.patient_id
    WHERE a.id = appointment_outcomes.appointment_id AND p.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_appointment_outcomes_appointment_id ON public.appointment_outcomes(appointment_id);

-- Create appointment treatments table
CREATE TABLE IF NOT EXISTS public.appointment_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  nihdi_code text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  tariff numeric(10,2) NOT NULL DEFAULT 0,
  mutuality_share numeric(10,2) NOT NULL DEFAULT 0,
  patient_share numeric(10,2) NOT NULL DEFAULT 0,
  tooth_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can manage treatments for own appointments"
ON public.appointment_treatments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE a.id = appointment_treatments.appointment_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view treatments for their appointments"
ON public.appointment_treatments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.profiles p ON p.id = a.patient_id
    WHERE a.id = appointment_treatments.appointment_id AND p.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_appointment_treatments_appointment_id ON public.appointment_treatments(appointment_id);

-- Add linking columns to existing tables
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Add completed_by and completed_at to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- NIHDI treatments reference table
CREATE TABLE IF NOT EXISTS public.nihdi_treatments (
  code text PRIMARY KEY,
  description text NOT NULL,
  base_tariff numeric(10,2) NOT NULL,
  vat_rate numeric(5,2) NOT NULL DEFAULT 0,
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nihdi_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read nihdi treatments" ON public.nihdi_treatments FOR SELECT USING (auth.role() = 'authenticated');

-- Patient mutuality profiles (insurance coverage)
CREATE TABLE IF NOT EXISTS public.patient_mutuality_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mutuality_code text NOT NULL,
  mutuality_name text,
  coverage_percentage numeric(5,2) NOT NULL DEFAULT 0,
  tier_payant boolean DEFAULT false,
  omnio_vip_status text DEFAULT 'none' CHECK (omnio_vip_status IN ('none','omnio','vip')),
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_mutuality_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can manage patient mutuality profiles"
ON public.patient_mutuality_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles pr ON pr.id = d.profile_id
    WHERE a.patient_id = patient_mutuality_profiles.patient_id AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their mutuality profiles"
ON public.patient_mutuality_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = patient_mutuality_profiles.patient_id AND p.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_patient_mutuality_profiles_patient_id ON public.patient_mutuality_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_mutuality_profiles_validity ON public.patient_mutuality_profiles(patient_id, valid_from, valid_to);