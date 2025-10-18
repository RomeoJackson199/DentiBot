-- Create secure function to assign provider role
create or replace function public.assign_provider_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Get the current authenticated user
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Insert provider role if it doesn't exist
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'provider'::public.app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.assign_provider_role() to authenticated;