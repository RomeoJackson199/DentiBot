-- Add missing columns to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_limit INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_limit_monthly INTEGER;

-- Delete old plans
DELETE FROM public.subscription_plans;

-- Insert the correct 3 subscription plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, customer_limit, email_limit_monthly, features, is_active)
VALUES 
  (
    'Starter',
    'starter',
    29.99,
    299.99,
    500,
    NULL,
    '["Up to 500 customers", "Basic appointment scheduling", "Patient management", "Email notifications", "Basic reports"]'::jsonb,
    true
  ),
  (
    'Professional',
    'professional',
    79.99,
    799.99,
    2500,
    2000,
    '["Up to 2,500 customers", "Everything in Starter", "2,000 emails/month", "Advanced analytics", "SMS notifications", "Custom branding", "Priority support"]'::jsonb,
    true
  ),
  (
    'Enterprise',
    'enterprise',
    199.99,
    1999.99,
    7500,
    7500,
    '["Up to 7,500 customers", "Everything in Professional", "7,500 emails/month", "Unlimited staff accounts", "API access", "Dedicated support", "Custom integrations"]'::jsonb,
    true
  );