-- Fix business_members RLS recursion and seed business

-- 1) Drop recursive policy
drop policy if exists "Business owners can manage members" on public.business_members;

-- 2) Keep the SELECT policy for users' own memberships
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='business_members'
      and policyname='Users can view their own memberships'
  ) then
    create policy "Users can view their own memberships"
      on public.business_members
      for select
      to authenticated
      using (profile_id in (select profiles.id from public.profiles where profiles.user_id = auth.uid()));
  end if;
end $$;

-- 3) Owners can INSERT members (non-recursive)
create policy "Owners can add members"
  on public.business_members
  for insert
  to authenticated
  with check (
    business_id in (
      select b.id from public.businesses b
      join public.profiles p on p.id = b.owner_profile_id
      where p.user_id = auth.uid()
    )
  );

-- 4) Owners can UPDATE members
create policy "Owners can update members"
  on public.business_members
  for update
  to authenticated
  using (
    business_id in (
      select b.id from public.businesses b
      join public.profiles p on p.id = b.owner_profile_id
      where p.user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select b.id from public.businesses b
      join public.profiles p on p.id = b.owner_profile_id
      where p.user_id = auth.uid()
    )
  );

-- 5) Owners can DELETE members
create policy "Owners can delete members"
  on public.business_members
  for delete
  to authenticated
  using (
    business_id in (
      select b.id from public.businesses b
      join public.profiles p on p.id = b.owner_profile_id
      where p.user_id = auth.uid()
    )
  );

-- 6) Seed business for romeojulianjackson@gmail.com
do $$
declare
  v_owner_profile uuid;
  v_business_id uuid;
  v_dentist_id uuid;
begin
  select id into v_owner_profile from public.profiles where email = 'romeojulianjackson@gmail.com' limit 1;

  if v_owner_profile is null then
    raise notice 'Profile not found for romeojulianjackson@gmail.com, skipping seed';
    return;
  end if;

  -- Create business if not exists
  if not exists (select 1 from public.businesses where slug = 'smile-dental-clinic') then
    insert into public.businesses (id, name, slug, owner_profile_id, primary_color, secondary_color, currency, tagline)
    values (gen_random_uuid(), 'Smile Dental Clinic', 'smile-dental-clinic', v_owner_profile, '#0F3D91', '#66D2D6', 'USD', 'Your trusted dental care partner')
    returning id into v_business_id;
  else
    select id into v_business_id from public.businesses where slug = 'smile-dental-clinic';
  end if;

  -- Ensure membership as owner
  insert into public.business_members (id, business_id, profile_id, role)
  values (gen_random_uuid(), v_business_id, v_owner_profile, 'owner')
  on conflict (business_id, profile_id) do nothing;

  -- Create dentist row if missing
  if not exists (select 1 from public.dentists d where d.profile_id = v_owner_profile) then
    insert into public.dentists (id, profile_id, is_active, created_at, updated_at)
    values (gen_random_uuid(), v_owner_profile, true, now(), now())
    returning id into v_dentist_id;
  else
    select id into v_dentist_id from public.dentists where profile_id = v_owner_profile;
  end if;

  -- Link provider to business
  insert into public.provider_business_map (id, provider_id, business_id, role, created_at)
  values (gen_random_uuid(), v_owner_profile, v_business_id, 'owner', now())
  on conflict (provider_id, business_id) do nothing;

  -- Remove patient appointments to avoid conflicts
  delete from public.appointments where patient_id = v_owner_profile;

  raise notice 'Successfully seeded Smile Dental Clinic for romeojulianjackson@gmail.com';
end $$;