-- Create homepage_settings table for customizable business homepages
CREATE TABLE IF NOT EXISTS public.homepage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  hero_title TEXT DEFAULT 'Welcome to Our Practice',
  hero_subtitle TEXT DEFAULT 'Quality dental care for your whole family',
  hero_image_url TEXT,
  show_services BOOLEAN DEFAULT true,
  show_about BOOLEAN DEFAULT true,
  about_title TEXT DEFAULT 'About Us',
  about_content TEXT DEFAULT 'We are dedicated to providing exceptional dental care...',
  cta_text TEXT DEFAULT 'Book Appointment',
  cta_link TEXT DEFAULT '/book-appointment',
  custom_sections JSONB DEFAULT '[]'::jsonb,
  theme_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id)
);

-- Enable RLS
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Public can view active homepage settings
CREATE POLICY "Public can view active homepage settings"
ON public.homepage_settings
FOR SELECT
USING (is_active = true);

-- Business members can manage their homepage settings
CREATE POLICY "Business members can manage homepage settings"
ON public.homepage_settings
FOR ALL
USING (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.business_members bm ON bm.business_id = b.id
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_homepage_settings_updated_at
  BEFORE UPDATE ON public.homepage_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_homepage_settings_business_id ON public.homepage_settings(business_id);