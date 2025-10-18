-- Fix infinite recursion in dentists RLS by removing subqueries to profiles and using security-definer function

-- 1) Drop existing dentists policies that reference profiles
DROP POLICY IF EXISTS "Dentists can delete their own record" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can update their own record" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can view their own record" ON public.dentists;
DROP POLICY IF EXISTS "Users can create their own dentist record" ON public.dentists;

-- Keep the non-recursive booking visibility policy as-is
-- CREATE POLICY "Authenticated users can view dentist booking info" stays

-- 2) Recreate non-recursive dentists policies using security-definer function
-- Note: public.get_current_user_profile_id() is SECURITY DEFINER and bypasses RLS

CREATE POLICY "Dentists can view their own record"
ON public.dentists
FOR SELECT
TO authenticated
USING (
  profile_id = public.get_current_user_profile_id()
);

CREATE POLICY "Users can create their own dentist record"
ON public.dentists
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = public.get_current_user_profile_id()
);

CREATE POLICY "Dentists can update their own record"
ON public.dentists
FOR UPDATE
TO authenticated
USING (
  profile_id = public.get_current_user_profile_id()
)
WITH CHECK (
  profile_id = public.get_current_user_profile_id()
);

CREATE POLICY "Dentists can delete their own record"
ON public.dentists
FOR DELETE
TO authenticated
USING (
  profile_id = public.get_current_user_profile_id()
);
