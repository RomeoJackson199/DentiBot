-- Fix reviews table foreign key constraint
-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_dentist_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_dentist_id_fkey 
FOREIGN KEY (dentist_id) REFERENCES public.dentists(id) ON DELETE CASCADE;

-- Update the RLS policy to use the correct table reference
DROP POLICY IF EXISTS "Dentists view their reviews" ON public.reviews;

CREATE POLICY "Dentists view their reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = reviews.dentist_id AND p.user_id = auth.uid()
    )
  );