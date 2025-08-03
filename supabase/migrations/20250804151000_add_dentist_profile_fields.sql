-- Add clinic_address, languages and rename specialization to specialty in dentists table
ALTER TABLE public.dentists
  RENAME COLUMN specialization TO specialty;

ALTER TABLE public.dentists
  ADD COLUMN clinic_address TEXT,
  ADD COLUMN languages TEXT[];
