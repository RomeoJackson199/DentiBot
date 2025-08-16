-- Messaging system schema
-- Enable required extensions
create extension if not exists pgcrypto;

-- Enum types
do $$ begin
  create type message_type as enum ('text','attachment','quick_reply','system','voice_note');
exception when duplicate_object then null; end $$;

do $$ begin
  create type receipt_status as enum ('delivered','seen');
exception when duplicate_object then null; end $$;

-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  title text,
  is_e2ee boolean not null default false,
  encryption_scheme text,
  -- Placeholder for future envelope-encryption material (not used unless E2EE enabled)
  e2ee_material jsonb
);

-- Auto update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Conversation participants
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('patient','dentist')),
  archived boolean not null default false,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  type message_type not null default 'text',
  content text,
  encrypted_payload jsonb,
  encryption_scheme text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Message receipts (delivered/seen)
create table if not exists public.message_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status receipt_status not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, status)
);

-- Message attachments metadata
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_messages_conversation_created_at on public.messages (conversation_id, created_at desc);
create index if not exists idx_participants_user on public.conversation_participants (user_id);
create index if not exists idx_participants_conversation on public.conversation_participants (conversation_id);
create index if not exists idx_receipts_message_user on public.message_receipts (message_id, user_id);

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;
alter table public.message_attachments enable row level security;

-- Helper policy predicate: is participant
create or replace view public._conversation_membership as
select cp.conversation_id, cp.user_id
from public.conversation_participants cp;

-- Conversations policies
create policy if not exists conversations_select on public.conversations
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  ));

create policy if not exists conversations_insert on public.conversations
  for insert with check (auth.uid() is not null);

create policy if not exists conversations_update on public.conversations
  for update using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  ));

-- Prevent deletes by default
create policy if not exists conversations_delete_deny on public.conversations
  for delete using (false);

-- Participants policies
create policy if not exists participants_select on public.conversation_participants
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
  ));

-- Allow self insert and creator-managed insert
create policy if not exists participants_insert on public.conversation_participants
  for insert with check (
    -- Allow adding yourself to a conversation you created
    (user_id = auth.uid() and exists (
      select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid()
    ))
    or
    -- Allow creator to add the other party (e.g., dentist/patient)
    (exists (
      select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid()
    ))
  );

create policy if not exists participants_update on public.conversation_participants
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists participants_delete on public.conversation_participants
  for delete using (user_id = auth.uid());

-- Messages policies
create policy if not exists messages_select on public.messages
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  ));

create policy if not exists messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- Disallow updates/deletes to preserve medical records
create policy if not exists messages_update_deny on public.messages
  for update using (false);
create policy if not exists messages_delete_deny on public.messages
  for delete using (false);

-- Receipts policies
create policy if not exists receipts_select on public.message_receipts
  for select using (exists (
    select 1 from public.conversation_participants cp
    join public.messages m on m.conversation_id = cp.conversation_id
    where m.id = message_receipts.message_id
      and cp.user_id = auth.uid()
  ));

create policy if not exists receipts_insert on public.message_receipts
  for insert with check (
    user_id = auth.uid() and exists (
      select 1 from public.conversation_participants cp
      join public.messages m on m.conversation_id = cp.conversation_id
      where m.id = message_receipts.message_id
        and cp.user_id = auth.uid()
    )
  );

create policy if not exists receipts_update_deny on public.message_receipts
  for update using (false);
create policy if not exists receipts_delete_self on public.message_receipts
  for delete using (user_id = auth.uid());

-- Attachments policies
create policy if not exists attachments_select on public.message_attachments
  for select using (exists (
    select 1 from public.conversation_participants cp
    join public.messages m on m.id = message_attachments.message_id
    where cp.conversation_id = m.conversation_id
      and cp.user_id = auth.uid()
  ));

create policy if not exists attachments_insert on public.message_attachments
  for insert with check (exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_attachments.message_id
      and cp.user_id = auth.uid()
  ));

create policy if not exists attachments_update_deny on public.message_attachments
  for update using (false);
create policy if not exists attachments_delete_deny on public.message_attachments
  for delete using (false);

-- Storage bucket for message attachments (secured by policies)
-- Note: requires storage extension enabled in Supabase
select
  case when exists (select 1 from storage.buckets where id = 'message-attachments') then null
  else storage.create_bucket('message-attachments', public := false)
end;

-- Storage RLS policies for message attachments paths:
-- Path convention: conversations/{conversation_id}/{message_id}/{filename}
create policy if not exists storage_msg_read on storage.objects
  for select to authenticated using (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversation_participants cp
      join public.messages m on m.id::text = split_part(objects.name, '/', 3)
      where cp.conversation_id::text = split_part(objects.name, '/', 2)
        and cp.user_id = auth.uid()
        and m.conversation_id = cp.conversation_id
    )
  );

create policy if not exists storage_msg_upload on storage.objects
  for insert to authenticated with check (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversation_participants cp
      join public.messages m on m.id::text = split_part(objects.name, '/', 3)
      where cp.conversation_id::text = split_part(objects.name, '/', 2)
        and cp.user_id = auth.uid()
        and m.conversation_id = cp.conversation_id
    )
  );

create policy if not exists storage_msg_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversation_participants cp
      join public.messages m on m.id::text = split_part(objects.name, '/', 3)
      where cp.conversation_id::text = split_part(objects.name, '/', 2)
        and cp.user_id = auth.uid()
        and m.conversation_id = cp.conversation_id
    )
  );