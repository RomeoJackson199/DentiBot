-- Add phone and address columns to businesses table if they don't exist
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update RLS policies to allow update/select of these columns (existing policies should cover *, but good to be sure)
-- (No specific column level security usually in Supabase RLS unless specified)
