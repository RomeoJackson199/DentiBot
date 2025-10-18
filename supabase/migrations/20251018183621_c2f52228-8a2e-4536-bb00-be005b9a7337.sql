-- Assign default 'customer' role when a new profile is created
create or replace function public.assign_default_customer_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.user_id, 'customer'::public.app_role)
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

-- Ensure trigger exists
drop trigger if exists trg_profiles_assign_default_role on public.profiles;
create trigger trg_profiles_assign_default_role
after insert on public.profiles
for each row
execute function public.assign_default_customer_role();

-- Backfill existing profiles with a default role if missing
insert into public.user_roles (user_id, role)
select p.user_id, 'customer'::public.app_role
from public.profiles p
left join public.user_roles ur
  on ur.user_id = p.user_id and ur.role = 'customer'::public.app_role
where ur.id is null;