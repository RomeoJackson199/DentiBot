-- Critical Security Fixes Migration
-- Fixes RLS policies without audit logging

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

-- 4. Secure Insurance Provider Data (MEDIUM)
-- Remove public access and restrict to authenticated users only
DROP POLICY IF EXISTS "Public can view insurance providers" ON public.insurance_providers;
DROP POLICY IF EXISTS "Authenticated users can view insurance providers" ON public.insurance_providers;

CREATE POLICY "Authenticated users can view insurance providers" 
ON public.insurance_providers 
FOR SELECT 
TO authenticated
USING (is_active = true);