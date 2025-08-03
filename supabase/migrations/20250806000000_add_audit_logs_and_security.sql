-- Add audit logs table for comprehensive security logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('data_access', 'data_modification', 'authentication', 'security_event', 'encryption', 'decryption')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text,
  record_id text,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add encryption metadata table to track encrypted fields
CREATE TABLE IF NOT EXISTS public.encryption_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  field_name text NOT NULL,
  encryption_algorithm text DEFAULT 'AES-GCM',
  encryption_key_id text,
  encrypted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(table_name, record_id, field_name)
);

-- Add security events table for tracking security incidents
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('failed_login', 'suspicious_activity', 'data_breach_attempt', 'unauthorized_access', 'encryption_failure')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time ZONE DEFAULT now()
);

-- Add multi-factor authentication settings table
CREATE TABLE IF NOT EXISTS public.mfa_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mfa_enabled boolean DEFAULT false,
  mfa_method text CHECK (mfa_method IN ('totp', 'sms', 'email')),
  backup_codes text[],
  last_used timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit logs (admin only access)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for encryption metadata (admin only access)
CREATE POLICY "Only admins can view encryption metadata" ON public.encryption_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for security events (admin only access)
CREATE POLICY "Only admins can view security events" ON public.security_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for MFA settings
CREATE POLICY "Users can view their own MFA settings" ON public.mfa_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for user sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_encryption_metadata_table_record ON public.encryption_metadata(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_encryption_metadata_field ON public.encryption_metadata(field_name);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_event_type text,
  p_table_name text,
  p_record_id text,
  p_action text,
  p_details jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_logs (
    event_type,
    user_id,
    table_name,
    record_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    auth.uid(),
    p_table_name,
    p_record_id,
    p_action,
    p_details,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text,
  p_details jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_event_type,
    p_severity,
    auth.uid(),
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent',
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_field(
  p_table_name text,
  p_record_id text,
  p_field_name text,
  p_value text
)
RETURNS text AS $$
BEGIN
  -- This is a placeholder for the actual encryption logic
  -- In a real implementation, this would use pgcrypto or similar
  -- For now, we'll mark it as encrypted and store metadata
  INSERT INTO public.encryption_metadata (
    table_name,
    record_id,
    field_name,
    encryption_algorithm
  ) VALUES (
    p_table_name,
    p_record_id,
    p_field_name,
    'AES-GCM'
  ) ON CONFLICT (table_name, record_id, field_name) DO NOTHING;
  
  -- Return encrypted value (in real implementation, this would be the actual encrypted data)
  RETURN 'encrypted:' || encode(sha256(p_value::bytea), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_field(
  p_table_name text,
  p_record_id text,
  p_field_name text,
  p_encrypted_value text
)
RETURNS text AS $$
BEGIN
  -- This is a placeholder for the actual decryption logic
  -- In a real implementation, this would use pgcrypto or similar
  -- For now, we'll just return the original value if it's marked as encrypted
  IF p_encrypted_value LIKE 'encrypted:%' THEN
    -- In real implementation, decrypt the value
    RETURN 'decrypted_value'; -- Placeholder
  ELSE
    RETURN p_encrypted_value;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_resource text,
  p_action text
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Admin has all permissions
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Dentist permissions
  IF user_role = 'dentist' THEN
    RETURN p_resource IN ('appointments', 'medical_records', 'prescriptions', 'treatment_plans', 'patient_notes');
  END IF;
  
  -- Patient permissions
  IF user_role = 'patient' THEN
    RETURN p_action = 'read' AND p_resource IN ('appointments', 'medical_records', 'prescriptions', 'treatment_plans');
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to automatically log data modifications
CREATE OR REPLACE FUNCTION public.log_data_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event('data_modification', TG_TABLE_NAME, NEW.id::text, 'INSERT', jsonb_build_object('new_data', to_jsonb(NEW)));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event('data_modification', TG_TABLE_NAME, NEW.id::text, 'UPDATE', jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event('data_modification', TG_TABLE_NAME, OLD.id::text, 'DELETE', jsonb_build_object('old_data', to_jsonb(OLD)));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to sensitive tables
CREATE TRIGGER log_profiles_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_data_modification();

CREATE TRIGGER log_medical_records_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.log_data_modification();

CREATE TRIGGER log_prescriptions_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_data_modification();

CREATE TRIGGER log_treatment_plans_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.log_data_modification();

CREATE TRIGGER log_patient_notes_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_data_modification();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (if using pg_cron)
-- SELECT cron.schedule('cleanup-sessions', '0 */6 * * *', 'SELECT public.cleanup_expired_sessions();');