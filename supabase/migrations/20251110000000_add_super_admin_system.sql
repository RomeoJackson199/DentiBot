-- Super Admin System Migration
-- Adds super admin role, error tracking, and audit logging

-- Step 1: Extend app_role enum to include super_admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('patient', 'provider', 'super_admin');
  ELSE
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
  END IF;
END $$;

-- Step 2: Create super_admin_audit_log table for tracking all super admin actions
CREATE TABLE IF NOT EXISTS public.super_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_super_admin_audit_log_admin ON public.super_admin_audit_log(admin_user_id);
CREATE INDEX idx_super_admin_audit_log_created_at ON public.super_admin_audit_log(created_at DESC);
CREATE INDEX idx_super_admin_audit_log_action ON public.super_admin_audit_log(action);

ALTER TABLE public.super_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Step 3: Create system_errors table for error tracking
CREATE TABLE IF NOT EXISTS public.system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  url text,
  user_agent text,
  metadata jsonb,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX idx_system_errors_severity ON public.system_errors(severity);
CREATE INDEX idx_system_errors_resolved ON public.system_errors(resolved);
CREATE INDEX idx_system_errors_business ON public.system_errors(business_id);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Step 4: Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_super_admin boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'super_admin'::public.app_role
  ) INTO v_is_super_admin;

  RETURN v_is_super_admin;
END;
$$;

-- Step 5: Create function to get all businesses with metrics
CREATE OR REPLACE FUNCTION public.get_all_businesses_admin()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  owner_email text,
  owner_name text,
  created_at timestamptz,
  total_members bigint,
  total_appointments bigint,
  active_appointments bigint,
  total_patients bigint,
  custom_config jsonb,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    p.email as owner_email,
    CONCAT(p.first_name, ' ', p.last_name) as owner_name,
    b.created_at,
    COALESCE((SELECT COUNT(*) FROM business_members WHERE business_id = b.id), 0) as total_members,
    COALESCE((SELECT COUNT(*) FROM appointments WHERE business_id = b.id), 0) as total_appointments,
    COALESCE((SELECT COUNT(*) FROM appointments WHERE business_id = b.id AND status IN ('pending', 'confirmed')), 0) as active_appointments,
    COALESCE((SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE business_id = b.id), 0) as total_patients,
    b.custom_config,
    COALESCE(b.is_active, true) as is_active
  FROM businesses b
  LEFT JOIN profiles p ON b.owner_profile_id = p.id
  ORDER BY b.created_at DESC;
END;
$$;

-- Step 6: Create function to get all users across businesses
CREATE OR REPLACE FUNCTION public.get_all_users_admin(search_query text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz,
  businesses jsonb,
  roles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'business_id', bm.business_id,
        'business_name', b.name,
        'role', bm.role
      ))
      FROM business_members bm
      JOIN businesses b ON bm.business_id = b.id
      WHERE bm.profile_id = p.id
    ), '[]'::jsonb) as businesses,
    COALESCE((
      SELECT jsonb_agg(ur.role)
      FROM user_roles ur
      WHERE ur.user_id = p.user_id
    ), '[]'::jsonb) as roles
  FROM profiles p
  WHERE search_query IS NULL
    OR p.email ILIKE '%' || search_query || '%'
    OR p.first_name ILIKE '%' || search_query || '%'
    OR p.last_name ILIKE '%' || search_query || '%'
  ORDER BY p.created_at DESC;
END;
$$;

-- Step 7: Create function to get system statistics
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  SELECT jsonb_build_object(
    'total_businesses', (SELECT COUNT(*) FROM businesses),
    'active_businesses', (SELECT COUNT(*) FROM businesses WHERE COALESCE(is_active, true) = true),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_appointments', (SELECT COUNT(*) FROM appointments),
    'appointments_today', (
      SELECT COUNT(*) FROM appointments
      WHERE DATE(appointment_date) = CURRENT_DATE
    ),
    'total_errors', (SELECT COUNT(*) FROM system_errors),
    'unresolved_errors', (SELECT COUNT(*) FROM system_errors WHERE resolved = false),
    'critical_errors', (
      SELECT COUNT(*) FROM system_errors
      WHERE severity = 'critical' AND resolved = false
    ),
    'users_joined_this_month', (
      SELECT COUNT(*) FROM profiles
      WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    ),
    'businesses_created_this_month', (
      SELECT COUNT(*) FROM businesses
      WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Step 8: Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  INSERT INTO public.super_admin_audit_log (
    admin_user_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    v_user_id,
    v_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;

-- Step 9: RLS Policies for super admin tables
-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
  ON public.super_admin_audit_log FOR SELECT
  USING (public.is_super_admin());

-- Only super admins can view system errors
CREATE POLICY "Super admins can view system errors"
  ON public.system_errors FOR SELECT
  USING (public.is_super_admin());

-- Only super admins can update system errors
CREATE POLICY "Super admins can update system errors"
  ON public.system_errors FOR UPDATE
  USING (public.is_super_admin());

-- Anyone can insert system errors (for error reporting)
CREATE POLICY "Anyone can insert system errors"
  ON public.system_errors FOR INSERT
  WITH CHECK (true);

-- Step 10: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_businesses_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_super_admin_action(text, text, uuid, jsonb) TO authenticated;

-- Step 11: Add updated_at trigger to system_errors
CREATE TRIGGER update_system_errors_updated_at
  BEFORE UPDATE ON public.system_errors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
