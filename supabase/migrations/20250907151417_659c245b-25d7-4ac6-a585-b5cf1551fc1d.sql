-- Fix critical security vulnerability: Remove public access to invitation_tokens table
-- and implement proper RLS policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "System can create invitation tokens" ON public.invitation_tokens;
DROP POLICY IF EXISTS "System can update invitation tokens" ON public.invitation_tokens;

-- Create secure policies for invitation tokens

-- Only edge functions (service role) can create invitation tokens
CREATE POLICY "Service role can create invitation tokens" 
ON public.invitation_tokens 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Only edge functions (service role) can update invitation tokens  
CREATE POLICY "Service role can update invitation tokens"
ON public.invitation_tokens 
FOR UPDATE 
TO service_role 
USING (true);

-- Users can only view invitation tokens for their own verified email
-- and only if the token is valid (not used and not expired)
CREATE POLICY "Users can view valid invitations for their email"
ON public.invitation_tokens 
FOR SELECT 
TO authenticated 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND expires_at > now() 
  AND used = false
);

-- Edge functions can read invitation tokens for validation
CREATE POLICY "Service role can read invitation tokens"
ON public.invitation_tokens 
FOR SELECT 
TO service_role 
USING (true);

-- Add a policy for anon users to validate tokens through RPC functions only
-- This allows the invite page to work for unauthenticated users via RPC
CREATE POLICY "Allow RPC validation for anonymous users"
ON public.invitation_tokens 
FOR SELECT 
TO anon
USING (false); -- Block direct access, force use of RPC functions