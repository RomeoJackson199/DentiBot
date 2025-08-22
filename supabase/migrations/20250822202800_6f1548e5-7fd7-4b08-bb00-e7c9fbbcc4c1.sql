-- Fix notifications table and complete data import functionality
-- First, drop and recreate notifications table with proper structure

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES dentists(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium',
  is_read boolean DEFAULT false,
  action_url text,
  action_label text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications 
FOR SELECT 
USING (user_id = auth.uid());

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

CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;

-- Ensure import_session_id column exists and is properly indexed
CREATE INDEX IF NOT EXISTS idx_profiles_import_session_id ON profiles(import_session_id);

-- Update the process-csv-import function to handle invitations better
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
  -- Clean up any existing tokens for this profile/email
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