-- Fix the search path warning for security
ALTER FUNCTION public.get_current_dentist_id() SET search_path = public;