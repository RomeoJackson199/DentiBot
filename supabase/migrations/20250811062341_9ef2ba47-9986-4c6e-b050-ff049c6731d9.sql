-- 1) Create enum for pre-approval status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pre_approval_status') THEN
    CREATE TYPE public.pre_approval_status AS ENUM (
      'draft',
      'pending',
      'submitted',
      'needs_info',
      'approved',
      'rejected',
      'cancelled',
      'expired'
    );
  END IF;
END$$;

-- 2) Insurance providers reference table
CREATE TABLE IF NOT EXISTS public.insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  contact_phone TEXT,
  api_type TEXT NOT NULL DEFAULT 'email', -- email | api | portal
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated users) to view active providers for selection
-- If you prefer only authenticated users, change USING to (true) with TO authenticated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_providers' AND policyname = 'Anyone can view active insurance providers'
  ) THEN
    CREATE POLICY "Anyone can view active insurance providers"
    ON public.insurance_providers
    FOR SELECT
    USING (is_active = true);
  END IF;
END$$;

-- No mutation policies => only privileged contexts (e.g., SQL console) can edit providers

-- 3) Pre-approvals table
CREATE TABLE IF NOT EXISTS public.insurance_pre_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  member_id TEXT,
  policy_number TEXT,
  treatment_codes JSONB,                 -- e.g., array of CDT/ICD codes and quantities
  estimated_cost NUMERIC,                -- optional, for patient copy
  coverage_percentage INTEGER,           -- optional quick estimate
  documents JSONB NOT NULL DEFAULT '[]', -- list of file metadata or storage paths
  status public.pre_approval_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_pre_approvals ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preapps_patient ON public.insurance_pre_approvals(patient_id);
CREATE INDEX IF NOT EXISTS idx_preapps_dentist ON public.insurance_pre_approvals(dentist_id);
CREATE INDEX IF NOT EXISTS idx_preapps_status ON public.insurance_pre_approvals(status);
CREATE INDEX IF NOT EXISTS idx_preapps_created_at ON public.insurance_pre_approvals(created_at);

-- RLS: Dentists manage their own pre-approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_pre_approvals' AND policyname = 'Dentists can manage their own pre-approvals'
  ) THEN
    CREATE POLICY "Dentists can manage their own pre-approvals"
    ON public.insurance_pre_approvals
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = insurance_pre_approvals.dentist_id
          AND p.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = insurance_pre_approvals.dentist_id
          AND p.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- RLS: Patients can view their own pre-approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_pre_approvals' AND policyname = 'Patients can view their own pre-approvals'
  ) THEN
    CREATE POLICY "Patients can view their own pre-approvals"
    ON public.insurance_pre_approvals
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles pr
        WHERE pr.id = insurance_pre_approvals.patient_id
          AND pr.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- Optional: allow system contexts (e.g., edge functions) to insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_pre_approvals' AND policyname = 'System can create pre-approvals'
  ) THEN
    CREATE POLICY "System can create pre-approvals"
    ON public.insurance_pre_approvals
    FOR INSERT
    WITH CHECK (true);
  END IF;
END$$;

-- Triggers to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_insurance_providers_updated_at'
  ) THEN
    CREATE TRIGGER update_insurance_providers_updated_at
    BEFORE UPDATE ON public.insurance_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_insurance_pre_approvals_updated_at'
  ) THEN
    CREATE TRIGGER update_insurance_pre_approvals_updated_at
    BEFORE UPDATE ON public.insurance_pre_approvals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;