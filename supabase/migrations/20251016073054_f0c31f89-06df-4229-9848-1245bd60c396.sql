-- Add 'staff' to the existing user_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staff' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'staff';
  END IF;
END $$;

-- Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
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

-- RLS Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migration helper: Copy existing roles from profiles table to user_roles
-- Only for users that actually exist in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
WHERE p.user_id IS NOT NULL 
  AND p.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.user_id)
ON CONFLICT (user_id, role) DO NOTHING;

-- For dentist profiles, also ensure they have the dentist role
-- Only for users that actually exist in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'dentist'::user_role
FROM public.profiles p
JOIN public.dentists d ON d.profile_id = p.id
WHERE p.user_id IS NOT NULL
  AND d.is_active = true
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.user_id)
ON CONFLICT (user_id, role) DO NOTHING;