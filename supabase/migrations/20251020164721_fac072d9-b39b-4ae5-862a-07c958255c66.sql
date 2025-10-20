-- Allow dentists to view appointments assigned to them
CREATE POLICY "Dentists can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  dentist_id IN (
    SELECT d.id
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Allow dentists to update appointments assigned to them
CREATE POLICY "Dentists can update their own appointments"
ON public.appointments
FOR UPDATE
USING (
  dentist_id IN (
    SELECT d.id
    FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);