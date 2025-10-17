-- Add missing subscription fields to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.organizations.current_period_end IS 'When the current subscription period ends';
COMMENT ON COLUMN public.organizations.last_payment_date IS 'Last successful payment date';