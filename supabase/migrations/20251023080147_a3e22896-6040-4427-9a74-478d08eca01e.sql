-- Add missing columns used by UI components
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS consultation_notes text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Set a safe default for duration_minutes
ALTER TABLE public.appointments
  ALTER COLUMN duration_minutes SET DEFAULT 60;

-- Backfill any existing NULLs
UPDATE public.appointments
SET duration_minutes = 60
WHERE duration_minutes IS NULL;