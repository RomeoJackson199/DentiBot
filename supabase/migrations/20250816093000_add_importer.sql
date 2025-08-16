-- Importer schema setup
-- 1) Add columns to appointments for importer metadata and reminders safety
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS clinic_timezone text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid;

-- 2) Import jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_path text,
  source_file_hash text,
  source_mime_type text,
  source_type text CHECK (source_type IN ('csv','xlsx','ics')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dry_run_completed','importing','completed','failed')),
  entity_types text[] NOT NULL DEFAULT '{appointments,patients}',
  clinic_timezone text,
  total_rows integer DEFAULT 0,
  to_create integer DEFAULT 0,
  to_match integer DEFAULT 0,
  warnings integer DEFAULT 0,
  errors integer DEFAULT 0,
  report_path text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Import job items table
CREATE TABLE IF NOT EXISTS public.import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('ok','warning','error','skipped','needs_review')),
  message text,
  patient_id uuid,
  dentist_id uuid,
  appointment_id uuid,
  raw jsonb,
  normalized jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) Import mapping presets
CREATE TABLE IF NOT EXISTS public.import_mapping_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preset_name text NOT NULL,
  source_signature text,
  mapping jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_profile_id, preset_name)
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_mapping_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_jobs: owners only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'import_jobs' AND policyname = 'Owners can manage their import jobs'
  ) THEN
    CREATE POLICY "Owners can manage their import jobs" ON public.import_jobs
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = import_jobs.created_by AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = import_jobs.created_by AND p.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- RLS policies for import_job_items: owners via parent job
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'import_job_items' AND policyname = 'Owners can manage their import job items'
  ) THEN
    CREATE POLICY "Owners can manage their import job items" ON public.import_job_items
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.import_jobs j
        JOIN public.profiles p ON p.id = j.created_by
        WHERE j.id = import_job_items.job_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.import_jobs j
        JOIN public.profiles p ON p.id = j.created_by
        WHERE j.id = import_job_items.job_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- RLS policies for import_mapping_presets: owners only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'import_mapping_presets' AND policyname = 'Owners can manage their presets'
  ) THEN
    CREATE POLICY "Owners can manage their presets" ON public.import_mapping_presets
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = owner_profile_id AND p.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = owner_profile_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- Triggers for updated_at
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_job_items_updated_at
  BEFORE UPDATE ON public.import_job_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_mapping_presets_updated_at
  BEFORE UPDATE ON public.import_mapping_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Storage buckets for imports and reports
INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('import-reports', 'import-reports', false) ON CONFLICT (id) DO NOTHING;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_appt_dentist_patient_date ON public.appointments (dentist_id, patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs (created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_import_job_items_job_id ON public.import_job_items (job_id);

-- Storage policies: store under <auth.user_id>/<filename>
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload import files'
  ) THEN
    CREATE POLICY "Authenticated users can upload import files" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('imports','import-reports') AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own import files'
  ) THEN
    CREATE POLICY "Users can view their own import files" ON storage.objects
      FOR SELECT USING (
        bucket_id IN ('imports','import-reports') AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END$$;