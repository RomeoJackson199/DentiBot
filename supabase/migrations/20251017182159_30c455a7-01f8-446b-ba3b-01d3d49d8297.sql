-- Fix infinite recursion in organization_members RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage organization members" ON public.organization_members;

-- Create security definer function to check if user is in an organization
CREATE OR REPLACE FUNCTION public.user_is_in_organization(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND profile_id = public.get_current_user_profile_id()
  );
$$;

-- Create security definer function to check if user is admin/owner in organization
CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND profile_id = public.get_current_user_profile_id()
    AND role IN ('owner', 'admin')
  );
$$;

-- Create new RLS policies using security definer functions
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (public.user_is_in_organization(organization_id));

CREATE POLICY "Owners and admins can manage members"
  ON public.organization_members FOR ALL
  USING (public.user_is_org_admin(organization_id));

-- Update other policies to use security definer functions
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;

CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (public.user_is_in_organization(id));

CREATE POLICY "Organization owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.user_is_org_admin(id));

-- Update organization_settings policies
DROP POLICY IF EXISTS "Organization members can view settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Organization owners can manage settings" ON public.organization_settings;

CREATE POLICY "Organization members can view settings"
  ON public.organization_settings FOR SELECT
  USING (
    organization_id IS NOT NULL 
    AND public.user_is_in_organization(organization_id)
  );

CREATE POLICY "Organization owners can manage settings"
  ON public.organization_settings FOR ALL
  USING (
    organization_id IS NOT NULL 
    AND public.user_is_org_admin(organization_id)
  );

-- Update appointments policy
DROP POLICY IF EXISTS "Organization members can manage appointments" ON public.appointments;

CREATE POLICY "Organization members can manage appointments"
  ON public.appointments FOR ALL
  USING (
    (organization_id IS NOT NULL AND public.user_is_in_organization(organization_id))
    OR patient_id = public.get_current_user_profile_id()
  );