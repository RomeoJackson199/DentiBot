-- Create security audit logs table for tracking security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('password_change', '2fa_enabled', '2fa_disabled', '2fa_login', '2fa_failed')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);

-- Create index for faster queries by event_type
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);

-- Create index for faster queries by created_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own security audit logs
CREATE POLICY "Users can view own security logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: No one can update or delete audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
  ON public.security_audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON public.security_audit_logs
  FOR DELETE
  USING (false);

-- Add comment to table
COMMENT ON TABLE public.security_audit_logs IS 'Immutable audit log for security-related events like password changes and 2FA actions';
