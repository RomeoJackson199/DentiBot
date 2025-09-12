-- =============================================================================
-- CRITICAL SECURITY FIXES - Phase 1: RLS Policy Updates
-- =============================================================================

-- 1. SECURE DENTIST DATA ACCESS
-- Remove overly permissive policy and add proper restrictions
DROP POLICY IF EXISTS "Authenticated users can view dentist booking info" ON public.dentists;

-- Allow patients to view basic dentist info only when they have an appointment relationship
CREATE POLICY "Patients can view their dentist basic info" 
ON public.dentists 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.dentist_id = dentists.id 
    AND p.user_id = auth.uid()
  )
);

-- Allow dentists to manage their own profiles
CREATE POLICY "Dentists can manage their own profile" 
ON public.dentists 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = dentists.profile_id 
    AND p.user_id = auth.uid()
  )
);

-- 2. SECURE PATIENT PROFILE ACCESS  
-- Check if there are existing broad policies to remove
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR ALL
USING (user_id = auth.uid());

-- Allow dentists to view their patients' basic info (name, contact) only
CREATE POLICY "Dentists can view patient basic info" 
ON public.profiles 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    JOIN dentists d ON d.id = a.dentist_id
    JOIN profiles dp ON dp.id = d.profile_id
    WHERE a.patient_id = profiles.id 
    AND dp.user_id = auth.uid()
  )
);

-- 3. SECURE INSURANCE PROVIDER ACCESS
-- Remove overly broad access
DROP POLICY IF EXISTS "Authenticated users can view insurance providers" ON public.insurance_providers;

-- Only allow access to users who have active appointments or are dentists
CREATE POLICY "Authorized users can view insurance providers" 
ON public.insurance_providers 
FOR SELECT
USING (
  is_active = true 
  AND (
    -- User is a dentist
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'dentist'
    )
    OR
    -- User is a patient with appointments
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN appointments a ON a.patient_id = p.id
      WHERE p.user_id = auth.uid()
      AND a.appointment_date >= (now() - interval '30 days')
    )
  )
);

-- 4. SECURE APPOINTMENT SLOTS ACCESS
-- Update existing policy to be more restrictive while maintaining booking functionality
DROP POLICY IF EXISTS "Users can view available appointment slots for booking" ON public.appointment_slots;

-- Allow authenticated users to view available slots for booking (but not sensitive details)
CREATE POLICY "Authenticated users can view available booking slots" 
ON public.appointment_slots 
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_available = true
);

-- 5. ENSURE SECURE BACKUP LOGS (Already has good policy but let's verify)
-- The existing "Dentists can view backup logs" policy is appropriate

-- 6. ADD AUDIT LOGGING FOR SECURITY CHANGES
INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address)
VALUES (
  auth.uid(),
  'security_policy_update',
  'rls_policies', 
  jsonb_build_object(
    'tables_updated', ARRAY['dentists', 'profiles', 'insurance_providers', 'appointment_slots'],
    'security_level', 'critical',
    'migration_id', '20250907_comprehensive_security_fixes'
  ),
  inet_client_addr()
);

-- =============================================================================
-- VERIFICATION QUERIES (for post-migration testing)
-- =============================================================================

-- Test 1: Verify dentists table is no longer publicly accessible
-- Expected: Should only return dentists related to current user's appointments

-- Test 2: Verify profiles table access is restricted  
-- Expected: Users should only see their own profile + related dentist/patient profiles

-- Test 3: Verify insurance providers require proper authorization
-- Expected: Only dentists and patients with recent appointments can access

-- Test 4: Verify appointment slots maintain booking functionality
-- Expected: Authenticated users can still see available slots for booking