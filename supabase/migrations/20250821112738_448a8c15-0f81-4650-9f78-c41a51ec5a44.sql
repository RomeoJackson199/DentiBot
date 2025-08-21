-- Comprehensive Security Fixes Migration (Fixed)
-- Handles existing policies properly

-- 1. Fix Dentist Profile Exposure (CRITICAL)
-- Remove overly permissive policy that exposes all dentist personal information
DROP POLICY IF EXISTS "Anyone can view dentist profiles" ON public.profiles;

-- Create restricted policy that only exposes essential booking information
CREATE POLICY "Authenticated users can view dentist booking info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  role = 'dentist' AND 
  EXISTS (
    SELECT 1 FROM public.dentists d 
    WHERE d.profile_id = profiles.id 
    AND d.is_active = true
  )
);

-- 2. Secure Invitation Tokens (CRITICAL) 
-- Fix the vulnerable policy that allowed viewing all tokens
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.invitation_tokens;

-- Create secure policy that properly validates email ownership
CREATE POLICY "Users can view invitations for their verified email" 
ON public.invitation_tokens 
FOR SELECT 
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND expires_at > now()
  AND used = false
);

-- 3. Remove Anonymous Profile Creation (CRITICAL)
-- Remove policy that allows anonymous profile creation
DROP POLICY IF EXISTS "Allow anonymous profile creation" ON public.profiles;

-- Ensure profile creation requires authentication
CREATE POLICY "Authenticated users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Secure Insurance Provider Data (MEDIUM) - Check if exists first
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Public can view insurance providers" ON public.insurance_providers;
  DROP POLICY IF EXISTS "Authenticated users can view insurance providers" ON public.insurance_providers;
  
  -- Create new secure policy
  CREATE POLICY "Authenticated users can view insurance providers" 
  ON public.insurance_providers 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, skip
    NULL;
END $$;

-- 5. Add security audit log for this migration
INSERT INTO audit_logs (
  user_id,
  action,
  resource_type,
  details
) VALUES (
  auth.uid(),
  'security_migration_applied',
  'database_security',
  jsonb_build_object(
    'migration_name', 'comprehensive_security_fixes_v2',
    'fixes_applied', jsonb_build_array(
      'fixed_dentist_profile_exposure',
      'secured_invitation_tokens', 
      'removed_anonymous_profile_creation',
      'restricted_insurance_provider_access'
    ),
    'applied_at', now()
  )
);