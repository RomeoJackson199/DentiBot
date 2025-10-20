-- Dentist-only backend restoration (compatibility without code changes)
-- 1) Drop providers view if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'providers'
  ) THEN
    DROP VIEW public.providers CASCADE;
  END IF;
END
$$;

-- 2) If a real providers table exists, archive it safely
DO $$
DECLARE
  backup_exists boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'providers'
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'providers_backup'
    ) INTO backup_exists;

    IF backup_exists THEN
      EXECUTE 'ALTER TABLE public.providers RENAME TO providers_backup_' || to_char(now(), 'YYYYMMDDHH24MISS');
    ELSE
      ALTER TABLE public.providers RENAME TO providers_backup;
    END IF;
  END IF;
END
$$;

-- 3) Create a compatibility view mapping providers -> dentists
CREATE OR REPLACE VIEW public.providers AS
SELECT 
  d.id,
  d.profile_id,
  d.is_active,
  d.specialization,
  d.license_number,
  d.updated_at,
  d.created_at,
  d.wait_time_score,
  d.communication_score,
  d.total_ratings,
  d.average_rating
FROM public.dentists d;

COMMENT ON VIEW public.providers IS 'Compatibility view mapping to public.dentists to support legacy code expecting providers. Read-only; updates should target public.dentists.';