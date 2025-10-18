-- Fix syntax and finalize non-recursive dentists policies

-- Drop potentially recursive/overlapping policies if they exist
DROP POLICY IF EXISTS "Dentists can manage their own profile" ON public.dentists;
DROP POLICY IF EXISTS "Patients can view their dentist basic info" ON public.dentists;
DROP POLICY IF EXISTS "Authenticated users can view dentist booking info" ON public.dentists;
DROP POLICY IF EXISTS "Users can create their own dentist record" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can manage their own record" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can view their own record" ON public.dentists;
DROP POLICY IF EXISTS "Dentists can modify their own record" ON public.dentists;

-- 1) Booking visibility for authenticated users
CREATE POLICY "Authenticated users can view dentist booking info"
ON public.dentists
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- 2) Dentists can view their own record regardless of active status
CREATE POLICY "Dentists can view their own record"
ON public.dentists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dentists.profile_id AND p.user_id = auth.uid()
  )
);

-- 3) Dentists can create their own record
CREATE POLICY "Users can create their own dentist record"
ON public.dentists
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dentists.profile_id AND p.user_id = auth.uid()
  )
);

-- 4a) Dentists can update their own record
CREATE POLICY "Dentists can update their own record"
ON public.dentists
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dentists.profile_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dentists.profile_id AND p.user_id = auth.uid()
  )
);

-- 4b) Dentists can delete their own record
CREATE POLICY "Dentists can delete their own record"
ON public.dentists
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dentists.profile_id AND p.user_id = auth.uid()
  )
);