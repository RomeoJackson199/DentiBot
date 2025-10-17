-- Fix infinite recursion in user_roles RLS by removing recursive policies and adding safe ones
DO $$
DECLARE pol RECORD;
BEGIN
  -- Ensure RLS is enabled
  EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY';
  
  -- Drop ALL existing policies on user_roles to avoid recursion
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- Recreate minimal, non-recursive policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage roles using SECURITY DEFINER function (no recursion)
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Optional: index to speed up lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);