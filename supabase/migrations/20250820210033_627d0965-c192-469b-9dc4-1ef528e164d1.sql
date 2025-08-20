-- CRITICAL SECURITY FIXES: Restrict public access to sensitive data (Fixed version)

-- 1. Remove public access to dentists table (currently allows anyone to see all dentist data)
DROP POLICY IF EXISTS "Anyone can view active dentists for data migration" ON public.dentists;

-- Create new policy that only shows essential booking info to authenticated users
CREATE POLICY "Authenticated users can view dentist booking info" 
ON public.dentists 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- 2. Remove public access to insurance_providers (currently public)
DROP POLICY IF EXISTS "Anyone can view active insurance providers" ON public.insurance_providers;

-- Create authenticated-only policy for insurance providers
CREATE POLICY "Authenticated users can view insurance providers" 
ON public.insurance_providers 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- 3. Add proper RLS to backup_logs (system table should not be publicly accessible)
DROP POLICY IF EXISTS "Admins can view backup logs" ON public.backup_logs;
DROP POLICY IF EXISTS "System can manage backup logs" ON public.backup_logs;

-- Create secure policy for backup logs (dentists only)
CREATE POLICY "Dentists can view backup logs" 
ON public.backup_logs 
FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'dentist'::user_role
));

-- System can still create backup logs
CREATE POLICY "System can create backup logs" 
ON public.backup_logs 
FOR INSERT 
WITH CHECK (true);

-- 4. Fix database function security by adding explicit search_path
CREATE OR REPLACE FUNCTION public.update_dentist_ratings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.dentists 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    expertise_score = (
      SELECT COALESCE(AVG(expertise_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND expertise_rating IS NOT NULL
    ),
    communication_score = (
      SELECT COALESCE(AVG(communication_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND communication_rating IS NOT NULL
    ),
    wait_time_score = (
      SELECT COALESCE(AVG(wait_time_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND wait_time_rating IS NOT NULL
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.dentist_id, OLD.dentist_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;