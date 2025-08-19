-- Fix profiles table for CSV imports
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add missing specialty column to dentists table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dentists' AND column_name = 'specialty') THEN
        ALTER TABLE public.dentists ADD COLUMN specialty TEXT;
    END IF;
END $$;

-- Create system-level RLS policies for import operations
CREATE POLICY "System can create profiles during import" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow system to create profiles during imports (when user_id is null and import_session_id is present)
  (user_id IS NULL AND import_session_id IS NOT NULL) OR
  -- Allow users to create their own profiles
  (user_id = auth.uid())
);

-- Update existing profiles policy to allow system imports
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.profiles;

-- Create improved invitation token system
CREATE OR REPLACE FUNCTION public.create_invitation_token(
  p_profile_id UUID,
  p_email TEXT,
  p_expires_hours INTEGER DEFAULT 72
) RETURNS UUID AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO public.invitation_tokens (
    profile_id,
    email,
    expires_at
  ) VALUES (
    p_profile_id,
    p_email,
    now() + (p_expires_hours || ' hours')::INTERVAL
  ) RETURNING token INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;