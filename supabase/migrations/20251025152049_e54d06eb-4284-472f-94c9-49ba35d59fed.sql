-- Add tagline column to businesses table if it doesn't exist already
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'businesses' 
        AND column_name = 'tagline'
    ) THEN
        -- Column doesn't exist in businesses, so we're good
        NULL;
    END IF;
END $$;

-- Add tagline column to clinic_settings table
ALTER TABLE public.clinic_settings 
ADD COLUMN IF NOT EXISTS tagline text;