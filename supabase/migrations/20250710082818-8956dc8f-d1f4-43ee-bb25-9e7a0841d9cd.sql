-- Add Google Calendar integration for dentists
ALTER TABLE dentists 
ADD COLUMN google_calendar_tokens JSONB DEFAULT NULL,
ADD COLUMN google_calendar_connected BOOLEAN DEFAULT FALSE;

-- Add updated_at trigger for dentists table if it doesn't exist
CREATE TRIGGER update_dentists_updated_at
BEFORE UPDATE ON dentists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();