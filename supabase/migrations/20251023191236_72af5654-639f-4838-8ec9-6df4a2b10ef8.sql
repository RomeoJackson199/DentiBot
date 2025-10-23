-- Create treatment_plans table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  estimated_cost NUMERIC,
  estimated_duration_weeks INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- RLS: patients view own plans
DROP POLICY IF EXISTS "Patients can view their own treatment plans" ON public.treatment_plans;
CREATE POLICY "Patients can view their own treatment plans"
ON public.treatment_plans
FOR SELECT
USING (patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- RLS: dentists view their patients' plans
DROP POLICY IF EXISTS "Dentists can view plans for their patients" ON public.treatment_plans;
CREATE POLICY "Dentists can view plans for their patients"
ON public.treatment_plans
FOR SELECT
USING (dentist_id IN (
  SELECT d.id FROM public.dentists d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

-- RLS: dentists create/update their plans
DROP POLICY IF EXISTS "Dentists can insert their treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can insert their treatment plans"
ON public.treatment_plans
FOR INSERT
WITH CHECK (dentist_id IN (
  SELECT d.id FROM public.dentists d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Dentists can update their treatment plans" ON public.treatment_plans;
CREATE POLICY "Dentists can update their treatment plans"
ON public.treatment_plans
FOR UPDATE
USING (dentist_id IN (
  SELECT d.id FROM public.dentists d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.user_id = auth.uid()
));

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_treatment_plans_updated_at ON public.treatment_plans;
CREATE TRIGGER update_treatment_plans_updated_at
BEFORE UPDATE ON public.treatment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_dentist_id ON public.treatment_plans(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);