-- Phase 1: Database Schema Transformation for Universal Booking Platform

-- Create enum types
CREATE TYPE industry_type AS ENUM (
  'healthcare',
  'beauty',
  'fitness',
  'consulting',
  'education',
  'legal',
  'other'
);

CREATE TYPE subscription_tier AS ENUM (
  'free_trial',
  'basic',
  'professional',
  'enterprise',
  'demo'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'inactive',
  'trial',
  'past_due',
  'canceled',
  'demo'
);

CREATE TYPE member_role AS ENUM (
  'owner',
  'admin',
  'staff',
  'viewer'
);

-- Create organizations table (core multi-tenant structure)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry_type industry_type NOT NULL DEFAULT 'healthcare',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free_trial',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  demo_data_generated BOOLEAN NOT NULL DEFAULT false,
  demo_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2),
  price_yearly NUMERIC(10, 2),
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization members table (link users to organizations)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'staff',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

-- Rename clinic_settings to organization_settings and expand
ALTER TABLE public.clinic_settings RENAME TO organization_settings;

-- Add new columns to organization_settings
ALTER TABLE public.organization_settings
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN business_name TEXT,
  ADD COLUMN industry_type industry_type DEFAULT 'healthcare',
  ADD COLUMN terminology JSONB DEFAULT '{
    "provider": "Provider",
    "booking": "Appointment",
    "customer": "Client"
  }'::jsonb;

-- Add organization_id to key tables
ALTER TABLE public.appointments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.payment_requests ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.payment_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_organizations_stripe_customer ON public.organizations(stripe_customer_id);
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX idx_organizations_is_demo ON public.organizations(is_demo);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_profile_id ON public.organization_members(profile_id);
CREATE INDEX idx_appointments_organization_id ON public.appointments(organization_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
    )
  );

CREATE POLICY "Organization owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS Policies for organization_members
CREATE POLICY "Members can view their organization members"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
    )
  );

CREATE POLICY "Owners and admins can manage organization members"
  ON public.organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
      AND role IN ('owner', 'admin')
    )
  );

-- Update appointments RLS to use organization_id
DROP POLICY IF EXISTS "Dentists can manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can manage own appointments" ON public.appointments;

CREATE POLICY "Organization members can manage appointments"
  ON public.appointments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
    )
    OR patient_id = public.get_current_user_profile_id()
  );

-- Update organization_settings RLS
DROP POLICY IF EXISTS "Dentists can manage their clinic settings" ON public.organization_settings;

CREATE POLICY "Organization members can view settings"
  ON public.organization_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
    )
  );

CREATE POLICY "Organization owners can manage settings"
  ON public.organization_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE profile_id = public.get_current_user_profile_id()
      AND role IN ('owner', 'admin')
    )
  );

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND profile_id = public.get_current_user_profile_id()
  );
$$;

-- Helper function to check if user is org owner/admin
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND profile_id = public.get_current_user_profile_id()
    AND role IN ('owner', 'admin')
  );
$$;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE profile_id = public.get_current_user_profile_id();
$$;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_booking_limit(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_plan subscription_tier;
  plan_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Get organization's subscription tier
  SELECT subscription_tier INTO org_plan
  FROM public.organizations
  WHERE id = org_id;
  
  -- Get plan limit from subscription_plans
  SELECT (limits->>'max_monthly_bookings')::INTEGER INTO plan_limit
  FROM public.subscription_plans
  WHERE name = org_plan::TEXT;
  
  -- Count this month's bookings
  SELECT COUNT(*) INTO current_count
  FROM public.appointments
  WHERE organization_id = org_id
  AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE);
  
  -- Return true if under limit or no limit
  RETURN (plan_limit IS NULL OR current_count < plan_limit);
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
('free_trial', 'Free Trial', '14-day free trial with limited features', 0, 0, 
  '["Online booking", "Basic calendar", "Email notifications"]'::jsonb,
  '{"max_monthly_bookings": 50, "max_staff": 2, "custom_branding": false}'::jsonb,
  1),
('basic', 'Basic', 'Perfect for small teams getting started', 29, 290,
  '["Online booking", "Calendar management", "Email & SMS notifications", "Basic analytics"]'::jsonb,
  '{"max_monthly_bookings": 200, "max_staff": 5, "custom_branding": false}'::jsonb,
  2),
('professional', 'Professional', 'Advanced features for growing businesses', 79, 790,
  '["Everything in Basic", "Unlimited bookings", "Custom branding", "Advanced analytics", "Priority support", "API access"]'::jsonb,
  '{"max_monthly_bookings": null, "max_staff": 20, "custom_branding": true}'::jsonb,
  3),
('enterprise', 'Enterprise', 'Custom solution for large organizations', null, null,
  '["Everything in Professional", "Unlimited everything", "Dedicated account manager", "Custom integrations", "SLA guarantee"]'::jsonb,
  '{"max_monthly_bookings": null, "max_staff": null, "custom_branding": true}'::jsonb,
  4),
('demo', 'Demo', 'Demo mode for testing the platform', 0, 0,
  '["View-only access", "Sample data", "Limited time"]'::jsonb,
  '{"max_monthly_bookings": 0, "max_staff": 0, "custom_branding": false, "read_only": true}'::jsonb,
  0);

-- Migration: Create organizations from existing dentists
INSERT INTO public.organizations (name, industry_type, subscription_tier, subscription_status)
SELECT 
  COALESCE(cs.clinic_name, 'My Practice') as name,
  'healthcare' as industry_type,
  'professional' as subscription_tier,
  'active' as subscription_status
FROM public.dentists d
LEFT JOIN public.organization_settings cs ON cs.dentist_id = d.id;

-- Link existing dentists to their new organizations
UPDATE public.organization_settings os
SET organization_id = o.id
FROM public.organizations o
WHERE os.clinic_name = o.name OR (os.clinic_name IS NULL AND o.name = 'My Practice');

-- Create organization members from existing dentists
INSERT INTO public.organization_members (organization_id, profile_id, role, joined_at)
SELECT 
  os.organization_id,
  d.profile_id,
  'owner'::member_role,
  now()
FROM public.dentists d
JOIN public.organization_settings os ON os.dentist_id = d.id
WHERE os.organization_id IS NOT NULL;

-- Update appointments with organization_id from dentists
UPDATE public.appointments a
SET organization_id = om.organization_id
FROM public.dentists d
JOIN public.organization_members om ON om.profile_id = d.profile_id
WHERE a.dentist_id = d.id;

-- Update profiles with organization_id for staff members
UPDATE public.profiles p
SET organization_id = om.organization_id
FROM public.organization_members om
WHERE om.profile_id = p.id;