-- Add missing clinic_address column to dentists table
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS clinic_address TEXT;