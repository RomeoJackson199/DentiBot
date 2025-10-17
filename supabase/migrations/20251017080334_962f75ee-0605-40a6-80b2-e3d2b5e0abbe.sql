-- First, ensure user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can manage user roles" ON public.user_roles;
CREATE POLICY "System can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Function to sync user_roles when profile role changes
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a profile role is set, sync to user_roles
  -- Only if user_id exists in auth.users
  IF NEW.user_id IS NOT NULL AND NEW.role IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, NEW.role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON public.profiles;
CREATE TRIGGER sync_user_roles_trigger
AFTER INSERT OR UPDATE OF role, user_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_from_profile();

-- Sync existing profiles to user_roles (only those with valid user_ids)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
WHERE p.user_id IS NOT NULL 
  AND p.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.user_id)
ON CONFLICT (user_id, role) DO NOTHING;