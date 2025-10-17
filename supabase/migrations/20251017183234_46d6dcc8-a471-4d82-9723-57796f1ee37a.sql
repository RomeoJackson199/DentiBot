-- Add branding columns to organization_settings table
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2D5D7B',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8B9BA5',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add comments
COMMENT ON COLUMN public.organization_settings.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN public.organization_settings.secondary_color IS 'Secondary brand color in hex format';
COMMENT ON COLUMN public.organization_settings.logo_url IS 'URL to organization logo';
COMMENT ON COLUMN public.organization_settings.tagline IS 'Organization tagline or motto';