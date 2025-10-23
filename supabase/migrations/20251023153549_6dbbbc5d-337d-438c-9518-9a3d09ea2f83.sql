-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- RLS policies for subscriptions
CREATE POLICY "Dentists can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    dentist_id IN (
      SELECT d.id FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    dentist_id IN (
      SELECT d.id FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (
    dentist_id IN (
      SELECT d.id FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, features) VALUES
('Pro', 100.00, 960.00, '[
  "Unlimited patients",
  "Advanced scheduling",
  "AI chat assistant",
  "Email notifications",
  "Basic analytics"
]'::jsonb),
('Enterprise', 150.00, 1440.00, '[
  "Everything in Pro",
  "Priority support",
  "Advanced analytics",
  "Custom branding",
  "Team collaboration",
  "API access"
]'::jsonb);