-- First, let's ensure we have proper audit logging for import activities
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL,
  filename TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  import_type TEXT NOT NULL DEFAULT 'patients' CHECK (import_type IN ('patients', 'appointments', 'inventory')),
  field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by_user_id UUID
);

-- Enable RLS
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for import sessions
CREATE POLICY "Dentists can manage their own import sessions"
ON public.import_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = import_sessions.dentist_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = import_sessions.dentist_id AND p.user_id = auth.uid()
  )
);

-- Create function to track import progress
CREATE OR REPLACE FUNCTION public.update_import_session_progress(
  p_session_id UUID,
  p_successful INTEGER DEFAULT 0,
  p_failed INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Add authorization check
  IF NOT EXISTS (
    SELECT 1 FROM import_sessions iss
    JOIN dentists d ON d.id = iss.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE iss.id = p_session_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the dentist can update their import sessions';
  END IF;

  UPDATE import_sessions 
  SET 
    successful_records = successful_records + p_successful,
    failed_records = failed_records + p_failed,
    status = COALESCE(p_status, status),
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_session_id;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_import_sessions_dentist_id ON public.import_sessions(dentist_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON public.import_sessions(status);

-- Update profiles table to track import source
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS import_session_id UUID REFERENCES public.import_sessions(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completion_status TEXT DEFAULT 'complete' CHECK (profile_completion_status IN ('incomplete', 'complete', 'pending_review'));

-- Create index for profile completion queries
CREATE INDEX IF NOT EXISTS idx_profiles_completion_status ON public.profiles(profile_completion_status) WHERE profile_completion_status != 'complete';