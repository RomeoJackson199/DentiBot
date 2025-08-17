-- Recalls system schema
CREATE TABLE IF NOT EXISTS public.recalls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  treatment_key text NOT NULL,
  treatment_label text NOT NULL,
  due_date date NOT NULL,
  suggested_slots jsonb NOT NULL DEFAULT '[]',
  booked_appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','snoozed','declined','booked','expired')),
  snooze_until date,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recalls_patient ON public.recalls(patient_id);
CREATE INDEX IF NOT EXISTS idx_recalls_dentist ON public.recalls(dentist_id);
CREATE INDEX IF NOT EXISTS idx_recalls_status ON public.recalls(status);
CREATE INDEX IF NOT EXISTS idx_recalls_due_date ON public.recalls(due_date);

ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recalls' AND policyname = 'Dentists manage recalls'
  ) THEN
    CREATE POLICY "Dentists manage recalls" ON public.recalls
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = recalls.dentist_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.dentists d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = recalls.dentist_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recalls' AND policyname = 'Patients manage own recalls'
  ) THEN
    CREATE POLICY "Patients manage own recalls" ON public.recalls
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles pr WHERE pr.id = recalls.patient_id AND pr.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles pr WHERE pr.id = recalls.patient_id AND pr.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recalls_updated_at') THEN
    CREATE TRIGGER update_recalls_updated_at
    BEFORE UPDATE ON public.recalls
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;