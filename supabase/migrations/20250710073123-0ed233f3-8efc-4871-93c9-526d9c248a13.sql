-- Update RLS policies to allow public viewing of dentist profiles
DROP POLICY IF EXISTS "Anyone can view active dentists" ON public.dentists;
DROP POLICY IF EXISTS "Anyone can view profiles for dentists" ON public.profiles;

-- Allow anyone to view active dentists
CREATE POLICY "Anyone can view active dentists" 
ON public.dentists 
FOR SELECT 
USING (is_active = true);

-- Allow anyone to view profiles that are linked to dentists
CREATE POLICY "Anyone can view profiles for dentists" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dentists 
    WHERE dentists.profile_id = profiles.id 
    AND dentists.is_active = true
  )
);