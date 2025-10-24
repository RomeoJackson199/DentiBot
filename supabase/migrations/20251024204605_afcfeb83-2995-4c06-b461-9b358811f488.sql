-- Add Google Calendar OAuth fields to dentists table
ALTER TABLE public.dentists 
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMP WITH TIME ZONE;

-- Add column to profiles as well for fallback
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false;