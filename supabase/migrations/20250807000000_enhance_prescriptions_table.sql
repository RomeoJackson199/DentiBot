-- Enhance prescriptions table with additional fields for better functionality
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS side_effects text,
ADD COLUMN IF NOT EXISTS contraindications text,
ADD COLUMN IF NOT EXISTS refills_allowed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_monitoring boolean DEFAULT false;

-- Enhance treatment_plans table with additional fields
ALTER TABLE public.treatment_plans 
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_specialist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_covered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_plan_available boolean DEFAULT false;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_prescriptions_urgent ON public.prescriptions(is_urgent);
CREATE INDEX IF NOT EXISTS idx_prescriptions_monitoring ON public.prescriptions(requires_monitoring);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_urgent ON public.treatment_plans(is_urgent);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_specialist ON public.treatment_plans(requires_specialist);

-- Update RLS policies to include new fields
-- (No changes needed as policies are based on dentist_id which remains the same)