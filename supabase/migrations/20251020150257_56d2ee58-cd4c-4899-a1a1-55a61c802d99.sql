-- Create dentists table to maintain backward compatibility
CREATE TABLE public.dentists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  average_rating NUMERIC NOT NULL DEFAULT 0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  expertise_score NUMERIC NOT NULL DEFAULT 0,
  communication_score NUMERIC NOT NULL DEFAULT 0,
  wait_time_score NUMERIC NOT NULL DEFAULT 0,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active dentists" 
ON public.dentists 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Dentists can view their own record" 
ON public.dentists 
FOR SELECT 
USING (profile_id IN (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Dentists can update their own record" 
ON public.dentists 
FOR UPDATE 
USING (profile_id IN (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Dentists can create their record" 
ON public.dentists 
FOR INSERT 
WITH CHECK ((
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'provider'::app_role
  )
) AND (profile_id IN (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
)));

-- Copy existing data from providers to dentists
INSERT INTO public.dentists (
  id, profile_id, specialization, is_active, average_rating, total_ratings,
  expertise_score, communication_score, wait_time_score, license_number,
  created_at, updated_at
)
SELECT 
  id, profile_id, specialization, is_active, average_rating, total_ratings,
  expertise_score, communication_score, wait_time_score, license_number,
  created_at, updated_at
FROM public.providers;

-- Add timestamp trigger
CREATE TRIGGER update_dentists_updated_at
BEFORE UPDATE ON public.dentists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();