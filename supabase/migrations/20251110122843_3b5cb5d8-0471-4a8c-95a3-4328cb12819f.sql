-- Admin RPCs for Super Admin Dashboard

-- 1) get_system_stats
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE(
  total_businesses bigint,
  total_users bigint,
  total_providers bigint,
  total_patients bigint,
  unresolved_errors bigint,
  last_24h_errors bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.businesses)::bigint AS total_businesses,
    (SELECT COUNT(*) FROM auth.users)::bigint AS total_users,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'provider'::public.app_role)::bigint AS total_providers,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'patient'::public.app_role)::bigint AS total_patients,
    (SELECT COUNT(*) FROM public.system_errors WHERE resolved = false)::bigint AS unresolved_errors,
    (SELECT COUNT(*) FROM public.system_errors WHERE created_at > now() - interval '24 hours')::bigint AS last_24h_errors;
END;
$$;

-- 2) get_all_businesses_admin
CREATE OR REPLACE FUNCTION public.get_all_businesses_admin()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  owner_email text,
  members_count integer,
  patients_count integer,
  appointments_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    (SELECT pr.email FROM public.profiles pr WHERE pr.id = b.owner_profile_id) AS owner_email,
    (SELECT COUNT(*) FROM public.business_members bm WHERE bm.business_id = b.id)::int AS members_count,
    (
      SELECT COUNT(DISTINCT a.patient_id)
      FROM public.appointments a
      WHERE a.business_id = b.id
    )::int AS patients_count,
    (
      SELECT COUNT(*)
      FROM public.appointments a
      WHERE a.business_id = b.id
    )::int AS appointments_count,
    b.created_at
  FROM public.businesses b
  ORDER BY b.created_at DESC;
END;
$$;

-- 3) get_all_users_admin
CREATE OR REPLACE FUNCTION public.get_all_users_admin(search_query text DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  roles public.app_role[],
  businesses jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT 
      u.id AS user_id,
      u.email,
      p.first_name,
      p.last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE search_query IS NULL
       OR u.email ILIKE '%' || search_query || '%'
       OR p.first_name ILIKE '%' || search_query || '%'
       OR p.last_name ILIKE '%' || search_query || '%'
  ), roles AS (
    SELECT ur.user_id, ARRAY_AGG(ur.role ORDER BY ur.role) AS roles
    FROM public.user_roles ur
    GROUP BY ur.user_id
  ), biz AS (
    SELECT p.user_id, jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name) ORDER BY b.created_at DESC) AS businesses
    FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    JOIN public.businesses b ON b.id = bm.business_id
    GROUP BY p.user_id
  )
  SELECT 
    b.user_id,
    b.email,
    b.first_name,
    b.last_name,
    COALESCE(r.roles, ARRAY[]::public.app_role[]) AS roles,
    COALESCE(z.businesses, '[]'::jsonb) AS businesses
  FROM base b
  LEFT JOIN roles r ON r.user_id = b.user_id
  LEFT JOIN biz z ON z.user_id = b.user_id
  ORDER BY b.email;
END;
$$;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';