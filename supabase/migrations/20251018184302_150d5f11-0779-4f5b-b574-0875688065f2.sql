-- Create businesses table
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  tagline text,
  logo_url text,
  primary_color text not null default '#0F3D91',
  secondary_color text not null default '#66D2D6',
  business_hours jsonb not null default '{}'::jsonb,
  currency text not null default 'USD',
  specialty_type text not null default 'dentist',
  ai_instructions text,
  ai_tone text not null default 'professional',
  ai_response_length text not null default 'medium',
  welcome_message text,
  appointment_keywords text[] not null default ARRAY['appointment', 'booking', 'schedule'],
  emergency_keywords text[] not null default ARRAY['emergency', 'urgent', 'pain'],
  show_logo_in_chat boolean not null default true,
  show_branding_in_emails boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

-- Business owners can manage their businesses
create policy "Business owners can view their businesses"
  on public.businesses for select
  using (
    owner_profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Business owners can update their businesses"
  on public.businesses for update
  using (
    owner_profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

-- Providers can create businesses
create policy "Providers can create businesses"
  on public.businesses for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'provider'
    )
  );

-- Public can view businesses by slug
create policy "Anyone can view businesses by slug"
  on public.businesses for select
  using (true);

-- Create providers table
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  specialization text,
  license_number text,
  is_active boolean not null default true,
  average_rating numeric(3,2) not null default 0,
  total_ratings integer not null default 0,
  expertise_score numeric(3,2) not null default 0,
  communication_score numeric(3,2) not null default 0,
  wait_time_score numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers enable row level security;

-- Providers can manage their own records
create policy "Providers can view their own record"
  on public.providers for select
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Providers can update their own record"
  on public.providers for update
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

-- Providers can create their record
create policy "Providers can create their record"
  on public.providers for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'provider'
    ) and
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

-- Anyone can view providers (for booking)
create policy "Anyone can view active providers"
  on public.providers for select
  using (is_active = true);

-- Create provider_business_map table
create table if not exists public.provider_business_map (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique(provider_id, business_id)
);

alter table public.provider_business_map enable row level security;

-- Members can view their business associations
create policy "Users can view their business associations"
  on public.provider_business_map for select
  using (
    provider_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

-- Business owners can manage members
create policy "Business owners can manage members"
  on public.provider_business_map for all
  using (
    business_id in (
      select id from public.businesses
      where owner_profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
  );

-- Providers can join businesses
create policy "Providers can join businesses"
  on public.provider_business_map for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'provider'
    ) and
    provider_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

-- Add updated_at trigger for businesses
create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute function public.update_updated_at_column();

-- Add updated_at trigger for providers
create trigger trg_providers_updated_at
before update on public.providers
for each row execute function public.update_updated_at_column();