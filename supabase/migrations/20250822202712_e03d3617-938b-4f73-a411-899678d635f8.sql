-- Fix the profiles table to ensure proper import functionality
-- Add missing columns and indexes for import workflow

-- Ensure import_session_id column exists and is properly indexed
CREATE INDEX IF NOT EXISTS idx_profiles_import_session_id ON profiles(import_session_id);

-- Ensure profile completion status has proper constraint
ALTER TABLE profiles ALTER COLUMN profile_completion_status SET DEFAULT 'incomplete';

-- Create a better function to handle invitation tokens with proper error handling
CREATE OR REPLACE FUNCTION public.create_invitation_token_with_cleanup(
  p_profile_id uuid, 
  p_email text, 
  p_expires_hours integer DEFAULT 72
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_id UUID;
BEGIN
  -- Clean up any existing tokens for this profile
  DELETE FROM public.invitation_tokens 
  WHERE profile_id = p_profile_id OR email = p_email;
  
  -- Create new token
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
$$;

-- Ensure proper RLS policies exist for imported profiles
DROP POLICY IF EXISTS "Imported profiles can be viewed by dentists" ON profiles;
CREATE POLICY "Imported profiles can be viewed by dentists" 
ON profiles 
FOR SELECT 
USING (
  import_session_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM import_sessions iss
    JOIN dentists d ON d.id = iss.dentist_id  
    JOIN profiles p ON p.id = d.profile_id
    WHERE iss.id = profiles.import_session_id 
    AND p.user_id = auth.uid()
  )
);

-- Ensure notification table exists for import completion notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES dentists(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium',
  read boolean DEFAULT false,
  action_url text,
  action_label text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" 
ON notifications 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Dentists can create notifications" ON notifications;
CREATE POLICY "Dentists can create notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = notifications.dentist_id 
    AND p.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;