-- Fix treatment_plans table schema mismatch
-- Change plan_name field to title field

-- First, drop the plan_name column if it exists
ALTER TABLE public.treatment_plans DROP COLUMN IF EXISTS plan_name;

-- Add the correct title column if it doesn't exist
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Treatment Plan';

-- Update the types file to match the actual database schema
-- This migration ensures the database schema matches the TypeScript types