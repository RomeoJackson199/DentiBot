-- Allow patients (customers) to view their own payment requests
-- and ensure dentists can view payment requests they created, independent of current business session

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Patients can view their own payment requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_requests'
      AND policyname = 'Patients can view their own payment requests'
  ) THEN
    CREATE POLICY "Patients can view their own payment requests"
    ON public.payment_requests
    FOR SELECT
    USING (
      patient_id IN (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- Dentists can view their own payment requests (by profile linkage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_requests'
      AND policyname = 'Dentists can view their own payment requests'
  ) THEN
    CREATE POLICY "Dentists can view their own payment requests"
    ON public.payment_requests
    FOR SELECT
    USING (
      dentist_id IN (
        SELECT d.id
        FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE p.user_id = auth.uid()
      )
    );
  END IF;
END$$;