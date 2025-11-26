-- Update subscription plans pricing to euros and customer limits
-- Starter: €249/month, Professional: €499/month, Enterprise: €999/month
-- Customer limits: 500, 2500, 7500 per month

-- Update existing plans with new pricing and customer limits
UPDATE public.subscription_plans
SET
  price_monthly = 249.00,
  price_yearly = 2480.00,
  customer_limit = 500,
  email_limit_monthly = NULL,
  features = '["Up to 500 customers per month", "Basic appointment scheduling", "Patient management", "Email notifications", "Basic reports"]'::jsonb
WHERE slug = 'starter';

UPDATE public.subscription_plans
SET
  price_monthly = 499.00,
  price_yearly = 4970.00,
  customer_limit = 2500,
  email_limit_monthly = 2000,
  features = '["Up to 2,500 customers per month", "Everything in Starter", "2,000 emails/month", "Advanced analytics", "SMS notifications", "Custom branding", "Priority support"]'::jsonb
WHERE slug = 'professional';

UPDATE public.subscription_plans
SET
  price_monthly = 999.00,
  price_yearly = 9950.00,
  customer_limit = 7500,
  email_limit_monthly = 7500,
  features = '["Up to 7,500 customers per month", "Everything in Professional", "7,500 emails/month", "Unlimited staff accounts", "API access", "Dedicated support", "Custom integrations"]'::jsonb
WHERE slug = 'enterprise';
