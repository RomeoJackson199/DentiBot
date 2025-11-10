-- Create system_errors table used by Super Admin dashboard
CREATE TABLE IF NOT EXISTS public.system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  url text,
  user_agent text,
  metadata jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_system_errors_updated_at ON public.system_errors;
CREATE TRIGGER trg_system_errors_updated_at
BEFORE UPDATE ON public.system_errors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create super_admin_audit_log table
CREATE TABLE IF NOT EXISTS public.super_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb
);

-- RPC to log super admin actions (used by app)
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.super_admin_audit_log (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;$$;

-- RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for system_errors
DROP POLICY IF EXISTS "Anyone can report system errors" ON public.system_errors;
CREATE POLICY "Anyone can report system errors"
ON public.system_errors
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can view all system errors" ON public.system_errors;
CREATE POLICY "Super admins can view all system errors"
ON public.system_errors
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can resolve system errors" ON public.system_errors;
CREATE POLICY "Super admins can resolve system errors"
ON public.system_errors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Policy for audit logs read access
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.super_admin_audit_log;
CREATE POLICY "Super admins can view audit logs"
ON public.super_admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Ensure helper and is_super_admin RPC exist
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin'::public.app_role);
$$;

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';