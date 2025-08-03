-- Add AI opt-out flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_opt_out BOOLEAN DEFAULT FALSE;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, appointment_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own reviews
CREATE POLICY "Patients manage their reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reviews.patient_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reviews.patient_id AND p.user_id = auth.uid()
    )
  );

-- Dentists can view reviews about themselves
CREATE POLICY "Dentists view their reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = reviews.dentist_id AND p.user_id = auth.uid()
    )
  );
