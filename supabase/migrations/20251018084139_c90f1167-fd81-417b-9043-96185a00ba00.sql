-- Fix: Recreate INSERT policy for self-assigning dentist role
DROP POLICY IF EXISTS "Users can self-assign dentist role when they own a dentist" ON public.user_roles;

CREATE POLICY "Users can self-assign dentist role when they own a dentist"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'dentist'::user_role
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.dentists d ON d.profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);
