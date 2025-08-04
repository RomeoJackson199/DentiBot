-- Debug migration to temporarily disable RLS for testing
-- This will help us determine if RLS policies are blocking patient inserts

-- Temporarily disable RLS on tables that patients need to insert into
ALTER TABLE public.patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans DISABLE ROW LEVEL SECURITY;

-- Add a comment to track this debug migration
COMMENT ON TABLE public.patient_notes IS 'RLS temporarily disabled for debugging patient insert issues';
COMMENT ON TABLE public.medical_records IS 'RLS temporarily disabled for debugging patient insert issues';
COMMENT ON TABLE public.prescriptions IS 'RLS temporarily disabled for debugging patient insert issues';
COMMENT ON TABLE public.treatment_plans IS 'RLS temporarily disabled for debugging patient insert issues';