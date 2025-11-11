-- Add fields to appointments table for AI conversation data
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS conversation_transcript JSONB;

COMMENT ON COLUMN public.appointments.ai_summary IS 'AI-generated summary of patient symptoms and concerns for the dentist';
COMMENT ON COLUMN public.appointments.conversation_transcript IS 'Full conversation history between patient and AI chatbot';