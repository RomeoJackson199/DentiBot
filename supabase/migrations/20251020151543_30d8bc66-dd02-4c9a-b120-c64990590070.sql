-- Add denormalized identity fields to dentists
ALTER TABLE public.dentists
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill from profiles
UPDATE public.dentists d
SET first_name = p.first_name,
    last_name = p.last_name,
    email = p.email
FROM public.profiles p
WHERE p.id = d.profile_id;

-- Keep dentists in sync when a profile updates
CREATE OR REPLACE FUNCTION public.sync_dentist_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dentists
  SET first_name = NEW.first_name,
      last_name = NEW.last_name,
      email = NEW.email,
      updated_at = now()
  WHERE profile_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dentist_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_dentist_from_profile
AFTER UPDATE OF first_name, last_name, email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_dentist_from_profile();

-- Populate on dentist insert
CREATE OR REPLACE FUNCTION public.populate_dentist_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pf RECORD;
BEGIN
  SELECT first_name, last_name, email INTO pf FROM public.profiles WHERE id = NEW.profile_id;
  NEW.first_name := COALESCE(pf.first_name, NEW.first_name);
  NEW.last_name := COALESCE(pf.last_name, NEW.last_name);
  NEW.email := COALESCE(pf.email, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_populate_dentist_identity ON public.dentists;
CREATE TRIGGER trg_populate_dentist_identity
BEFORE INSERT ON public.dentists
FOR EACH ROW
EXECUTE FUNCTION public.populate_dentist_identity();