-- Fix RLS for patient_insurance_profiles and seed default tariffs

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.patient_insurance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
  membership_number text,
  plan_name text,
  is_omnio boolean DEFAULT false,
  is_vip boolean DEFAULT false,
  valid_from date NOT NULL,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_insurance_profiles ENABLE ROW LEVEL SECURITY;

-- Drop incorrect or outdated policies if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_insurance_profiles' AND policyname = 'Dentists manage patient insurance'
  ) THEN
    DROP POLICY "Dentists manage patient insurance" ON public.patient_insurance_profiles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_insurance_profiles' AND policyname = 'Patients read own insurance'
  ) THEN
    DROP POLICY "Patients read own insurance" ON public.patient_insurance_profiles;
  END IF;
END $$;

-- Read policy: authenticated users can read if they are the patient or a dentist (broad dev policy)
CREATE POLICY IF NOT EXISTS "Read insurance (patient or dentist)" ON public.patient_insurance_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = patient_insurance_profiles.patient_id AND pr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid()
  )
);

-- Write policy: patient can manage their own, or any dentist can manage (broad dev policy)
CREATE POLICY IF NOT EXISTS "Write insurance (patient or dentist)" ON public.patient_insurance_profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = patient_insurance_profiles.patient_id AND pr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = patient_insurance_profiles.patient_id AND pr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid()
  )
);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_insurance_profiles_updated_at') THEN
    CREATE TRIGGER update_patient_insurance_profiles_updated_at
    BEFORE UPDATE ON public.patient_insurance_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Seed some default NIHDI tariffs if table exists and is empty-ish
CREATE TABLE IF NOT EXISTS public.tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  base_tariff numeric(10,2) NOT NULL,
  vat_rate numeric(5,2) DEFAULT 0.00,
  mutuality_share_pct numeric(5,2) DEFAULT 75.00,
  patient_share_pct numeric(5,2) DEFAULT 25.00,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure RLS enabled for tariffs
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated can read tariffs" ON public.tariffs FOR SELECT USING (auth.uid() IS NOT NULL);

-- Upsert a few example tariffs
INSERT INTO public.tariffs (code, description, base_tariff, vat_rate, mutuality_share_pct, patient_share_pct)
VALUES
  ('1001', 'Initial exam', 35.00, 0.00, 75.00, 25.00),
  ('2001', 'Bitewing X-ray (2)', 25.00, 0.00, 75.00, 25.00),
  ('3001', 'Cleaning (prophylaxis)', 50.00, 0.00, 75.00, 25.00),
  ('4001', 'Filling (1 surface)', 80.00, 0.00, 50.00, 50.00),
  ('4002', 'Filling (2 surfaces)', 120.00, 0.00, 50.00, 50.00)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  base_tariff = EXCLUDED.base_tariff,
  vat_rate = EXCLUDED.vat_rate,
  mutuality_share_pct = EXCLUDED.mutuality_share_pct,
  patient_share_pct = EXCLUDED.patient_share_pct,
  is_active = true,
  updated_at = now();