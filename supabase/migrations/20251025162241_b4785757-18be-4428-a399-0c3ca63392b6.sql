-- Create function to leave a clinic and downgrade role if no memberships remain
create or replace function public.leave_clinic(p_business_id uuid default public.get_current_business_id())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile_id uuid;
  v_remaining integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_business_id is null then
    raise exception 'No business context';
  end if;

  select id into v_profile_id from public.profiles where user_id = v_user_id;
  if v_profile_id is null then
    raise exception 'Profile not found';
  end if;

  -- Remove membership links for this business
  delete from public.business_members
  where business_id = p_business_id and profile_id = v_profile_id;

  delete from public.provider_business_map
  where business_id = p_business_id and provider_id = v_profile_id;

  -- Check if provider still belongs to other businesses
  select count(*) into v_remaining from public.provider_business_map where provider_id = v_profile_id;

  if v_remaining = 0 then
    -- Deactivate dentist record (they are no longer practicing anywhere)
    update public.dentists set is_active = false where profile_id = v_profile_id;

    -- Remove provider role so user is only a patient
    delete from public.user_roles where user_id = v_user_id and role = 'provider'::public.app_role;
  end if;

  return jsonb_build_object('success', true, 'remaining_businesses', v_remaining);
end;
$$;