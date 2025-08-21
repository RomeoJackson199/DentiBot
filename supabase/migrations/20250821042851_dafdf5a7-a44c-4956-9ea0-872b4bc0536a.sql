-- Apply the ai_opt_out migration that was previously created but not applied
-- Add AI opt-out flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_opt_out BOOLEAN DEFAULT FALSE;