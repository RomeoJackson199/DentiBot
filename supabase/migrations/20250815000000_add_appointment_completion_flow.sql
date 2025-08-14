-- Tariffs table for NIHDI codes and pricing
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

-- Patient insurance/mutuality profiles
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

-- Appointment outcomes
CREATE TABLE IF NOT EXISTS public.appointment_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('successful','partial','cancelled','complication')),
  notes text,
  pain_score integer CHECK (pain_score BETWEEN 0 AND 10),
  anesthesia_used boolean DEFAULT false,
  anesthesia_dose text,
  created_by uuid NOT NULL REFERENCES public.dentists(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Appointment performed treatments
CREATE TABLE IF NOT EXISTS public.appointment_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  tooth_ref text,
  tariff numeric(10,2) NOT NULL,
  mutuality_share numeric(10,2) NOT NULL DEFAULT 0,
  patient_share numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointment_treatments_appointment ON public.appointment_treatments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_outcomes_appointment ON public.appointment_outcomes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_profiles_patient ON public.patient_insurance_profiles(patient_id);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  total_amount_cents integer NOT NULL,
  patient_amount_cents integer NOT NULL,
  mutuality_amount_cents integer NOT NULL,
  vat_amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','paid','void')),
  claim_status text DEFAULT 'to_be_submitted' CHECK (claim_status IN ('to_be_submitted','submitted','approved','rejected','n/a')),
  payment_request_id uuid REFERENCES public.payment_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  tariff_cents integer NOT NULL,
  mutuality_cents integer NOT NULL DEFAULT 0,
  patient_cents integer NOT NULL DEFAULT 0,
  vat_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- Link appointment_id to prescriptions and medical_records
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON public.medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON public.prescriptions(appointment_id);

-- Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tariffs_updated_at') THEN
    CREATE TRIGGER update_tariffs_updated_at
    BEFORE UPDATE ON public.tariffs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_insurance_profiles_updated_at') THEN
    CREATE TRIGGER update_patient_insurance_profiles_updated_at
    BEFORE UPDATE ON public.patient_insurance_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Tariffs are readable by anyone authenticated
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tariffs' AND policyname = 'Authenticated can read tariffs'
  ) THEN
    CREATE POLICY "Authenticated can read tariffs" ON public.tariffs FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Dentists can manage their patients' insurance profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_insurance_profiles' AND policyname = 'Dentists manage patient insurance'
  ) THEN
    CREATE POLICY "Dentists manage patient insurance" ON public.patient_insurance_profiles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = d.id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = patient_insurance_profiles.provider_id OR p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Patients can read their own insurance profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_insurance_profiles' AND policyname = 'Patients read own insurance'
  ) THEN
    CREATE POLICY "Patients read own insurance" ON public.patient_insurance_profiles
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles pr WHERE pr.id = patient_insurance_profiles.patient_id AND pr.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Dentists can manage appointment outcomes and treatments for their appointments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointment_outcomes' AND policyname = 'Dentists manage outcomes'
  ) THEN
    CREATE POLICY "Dentists manage outcomes" ON public.appointment_outcomes
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.dentists d ON d.id = a.dentist_id
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE a.id = appointment_outcomes.appointment_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.dentists d ON d.id = a.dentist_id
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE a.id = appointment_outcomes.appointment_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointment_treatments' AND policyname = 'Dentists manage treatments'
  ) THEN
    CREATE POLICY "Dentists manage treatments" ON public.appointment_treatments
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.dentists d ON d.id = a.dentist_id
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE a.id = appointment_treatments.appointment_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.dentists d ON d.id = a.dentist_id
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE a.id = appointment_treatments.appointment_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Invoices policies: dentists manage, patients read their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Dentists manage invoices'
  ) THEN
    CREATE POLICY "Dentists manage invoices" ON public.invoices FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE d.id = invoices.dentist_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE d.id = invoices.dentist_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Patients read invoices'
  ) THEN
    CREATE POLICY "Patients read invoices" ON public.invoices FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles pr WHERE pr.id = invoices.patient_id AND pr.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'Dentists manage invoice items'
  ) THEN
    CREATE POLICY "Dentists manage invoice items" ON public.invoice_items FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.invoices i JOIN public.dentists d ON d.id = i.dentist_id JOIN public.profiles p ON p.id = d.profile_id WHERE i.id = invoice_items.invoice_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.invoices i JOIN public.dentists d ON d.id = i.dentist_id JOIN public.profiles p ON p.id = d.profile_id WHERE i.id = invoice_items.invoice_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'Patients read their invoice items'
  ) THEN
    CREATE POLICY "Patients read their invoice items" ON public.invoice_items FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.invoices i JOIN public.profiles pr ON pr.id = i.patient_id WHERE i.id = invoice_items.invoice_id AND pr.user_id = auth.uid()
      )
    );
  END IF;
END $$;