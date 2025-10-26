-- Add AI behavior customization columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_system_behavior TEXT,
ADD COLUMN IF NOT EXISTS ai_greeting TEXT,
ADD COLUMN IF NOT EXISTS ai_personality_traits JSONB DEFAULT '[]'::jsonb;