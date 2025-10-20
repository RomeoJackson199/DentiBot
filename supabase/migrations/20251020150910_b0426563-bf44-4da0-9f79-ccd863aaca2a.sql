-- Function: assign provider role automatically when a dentist record is created
CREATE OR REPLACE FUNCTION public.assign_provider_role_on_dentist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant 'provider' role to the owner of the profile linked to this dentist
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.user_id, 'provider'::public.app_role
  FROM public.profiles p
  WHERE p.id = NEW.profile_id
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: after insert on dentists
DROP TRIGGER IF EXISTS trg_assign_provider_role_on_dentist ON public.dentists;
CREATE TRIGGER trg_assign_provider_role_on_dentist
AFTER INSERT ON public.dentists
FOR EACH ROW
EXECUTE FUNCTION public.assign_provider_role_on_dentist();

-- Backfill: ensure all existing dentists have the provider role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'provider'::public.app_role
FROM public.dentists d
JOIN public.profiles p ON p.id = d.profile_id
ON CONFLICT (user_id, role) DO NOTHING;