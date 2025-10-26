-- Create business_services table for products/services that businesses offer
CREATE TABLE IF NOT EXISTS public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  requires_upfront_payment BOOLEAN NOT NULL DEFAULT false,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  duration_minutes INTEGER DEFAULT 60,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add service_id to appointments table to link appointments to services
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.business_services(id);

-- Add payment fields to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON public.business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_services_active ON public.business_services(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);

-- Enable RLS
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_services

-- Business members can manage their services
CREATE POLICY "Business members can manage services"
ON public.business_services
FOR ALL
TO authenticated
USING (
  business_id = get_current_business_id() 
  AND is_business_member(
    (SELECT id FROM profiles WHERE user_id = auth.uid()),
    business_id
  )
);

-- Anyone can view active services for any business (for booking)
CREATE POLICY "Anyone can view active services"
ON public.business_services
FOR SELECT
TO authenticated
USING (is_active = true);

-- Public (unauthenticated) can view active services
CREATE POLICY "Public can view active services"
ON public.business_services
FOR SELECT
TO anon
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_business_services_updated_at
  BEFORE UPDATE ON public.business_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();