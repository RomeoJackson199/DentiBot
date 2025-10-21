-- Allow dentists to view profiles of their patients (patients who have appointments with them)
CREATE POLICY "Dentists can view their patients' profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT a.patient_id
    FROM public.appointments a
    JOIN public.dentists d ON d.id = a.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);