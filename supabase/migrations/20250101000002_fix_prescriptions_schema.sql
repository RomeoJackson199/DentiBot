-- Fix prescriptions table schema mismatch
-- Change duration text field to duration_days number field

-- First, drop the duration column if it exists
ALTER TABLE public.prescriptions DROP COLUMN IF EXISTS duration;

-- Add the correct duration_days column
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS duration_days integer;

-- Update the types file to match the actual database schema
-- This migration ensures the database schema matches the TypeScript types