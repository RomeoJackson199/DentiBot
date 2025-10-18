-- Fix dentists table RLS for self-signup

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Dentists can manage their own profile" ON public.dentists;

-- Create policy allowing users to create their own dentist record
CREATE POLICY "Users can create their own dentist record"
ON public.dentists
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = dentists.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Create policy allowing dentists to view/update their own record
CREATE POLICY "Dentists can manage their own record"
ON public.dentists
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = dentists.profile_id
    AND profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = dentists.profile_id
    AND profiles.user_id = auth.uid()
  )
);