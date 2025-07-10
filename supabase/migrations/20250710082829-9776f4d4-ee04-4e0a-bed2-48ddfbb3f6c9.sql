-- Add Google Calendar integration for dentists
ALTER TABLE dentists 
ADD COLUMN google_calendar_tokens JSONB DEFAULT NULL,
ADD COLUMN google_calendar_connected BOOLEAN DEFAULT FALSE;