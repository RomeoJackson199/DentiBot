-- Reviews table
create table public.reviews (
  review_id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  dentist_id uuid references public.dentists(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;
create policy "patients manage own reviews" on public.reviews
  for all using (
    auth.uid() in (
      select user_id from public.profiles p where p.id = reviews.patient_id
    )
  ) with check (
    auth.uid() in (
      select user_id from public.profiles p where p.id = reviews.patient_id
    )
  );

-- Family members table
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  dob date not null,
  allergies text
);

alter table public.family_members enable row level security;
create policy "patients access own family members" on public.family_members
  for all using (
    auth.uid() in (
      select user_id from public.profiles p where p.id = family_members.patient_id
    )
  ) with check (
    auth.uid() in (
      select user_id from public.profiles p where p.id = family_members.patient_id
    )
  );

-- Favorites table
create table public.favorites (
  patient_id uuid references public.profiles(id) on delete cascade,
  dentist_id uuid references public.dentists(id) on delete cascade,
  primary key (patient_id, dentist_id)
);

alter table public.favorites enable row level security;
create policy "patients manage own favorites" on public.favorites
  for all using (
    auth.uid() in (
      select user_id from public.profiles p where p.id = favorites.patient_id
    )
  ) with check (
    auth.uid() in (
      select user_id from public.profiles p where p.id = favorites.patient_id
    )
  );

-- Waitlist table
create table public.waitlist (
  waitlist_id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  dentist_id uuid references public.dentists(id) on delete cascade not null,
  preferred_time text,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;
create policy "patients manage own waitlist entries" on public.waitlist
  for all using (
    auth.uid() in (
      select user_id from public.profiles p where p.id = waitlist.patient_id
    )
  ) with check (
    auth.uid() in (
      select user_id from public.profiles p where p.id = waitlist.patient_id
    )
  );

create policy "dentists view waitlist for themselves" on public.waitlist
  for select using (
    auth.uid() in (
      select p.user_id from public.profiles p join public.dentists d on p.id = d.profile_id where d.id = waitlist.dentist_id
    )
  );

-- Extend dentist profiles
alter table public.dentists
  add column city text,
  add column languages text[],
  add column specialty text,
  add column verified boolean default false,
  add column photo_url text,
  add column services_offered text[];

-- Extend patient profiles
alter table public.profiles
  add column ai_never_prompt boolean default false;

