-- Finalize dentist-centric clinic_settings RLS and trigger (idempotent)

-- Ensure table exists
create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.providers(id) on delete cascade,
  logo_url text,
  clinic_name text,
  primary_color text not null default '#0F3D91',
  secondary_color text not null default '#66D2D6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dentist_id)
);

-- Enable RLS
alter table public.clinic_settings enable row level security;

-- Drop and recreate policies (no IF NOT EXISTS support)
DROP POLICY IF EXISTS "Clinic settings are publicly readable" ON public.clinic_settings;
CREATE POLICY "Clinic settings are publicly readable" ON public.clinic_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Providers can insert their own clinic settings" ON public.clinic_settings;
CREATE POLICY "Providers can insert their own clinic settings" ON public.clinic_settings
FOR INSERT TO authenticated
WITH CHECK (
  dentist_id IN (
    SELECT p.id FROM public.providers p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE pr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Providers can update their own clinic settings" ON public.clinic_settings;
CREATE POLICY "Providers can update their own clinic settings" ON public.clinic_settings
FOR UPDATE TO authenticated
USING (
  dentist_id IN (
    SELECT p.id FROM public.providers p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE pr.user_id = auth.uid()
  )
)
WITH CHECK (
  dentist_id IN (
    SELECT p.id FROM public.providers p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE pr.user_id = auth.uid()
  )
);

-- Trigger: update updated_at
DROP TRIGGER IF EXISTS clinic_settings_set_updated_at ON public.clinic_settings;
CREATE TRIGGER clinic_settings_set_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();