-- Service requests: unified shuttle + valet dispatch
create table if not exists public.service_requests (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('shuttle', 'valet')),
  location_id     uuid references public.locations(id) on delete set null,
  session_id      text,                         -- parking session id or booking ref
  ticket_no       text,                         -- SH-XXXX or VLT-XXXX code
  guest_name      text,
  pickup_label    text,
  pickup_lat      float8,
  pickup_lng      float8,
  -- valet only
  plate           text,
  parking_zone    text,
  -- assignment
  driver_id       uuid references auth.users(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','accepted','en_route','arrived','done','cancelled')),
  eta_minutes     int,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Service messages: in-app chat per request
create table if not exists public.service_messages (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.service_requests(id) on delete cascade,
  sender      text not null check (sender in ('guest', 'driver')),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Extend drivers table with display info
alter table public.drivers
  add column if not exists name        text,
  add column if not exists plate       text,
  add column if not exists rating      numeric(3,1) default 5.0,
  add column if not exists avatar_initials text,
  add column if not exists vehicle_model   text;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists service_requests_updated_at on public.service_requests;
create trigger service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

-- RLS
alter table public.service_requests enable row level security;
alter table public.service_messages  enable row level security;

-- Guests read/insert by session_id (no auth required — UUID is the secret)
create policy "guest_read_own_request" on public.service_requests
  for select using (true);   -- read by request id via API route (service role)

create policy "guest_insert_request" on public.service_requests
  for insert with check (true);

create policy "driver_update_request" on public.service_requests
  for update using (auth.uid() = driver_id or driver_id is null);

-- Messages: anyone with the request_id can read/write (API enforces)
create policy "read_messages" on public.service_messages
  for select using (true);

create policy "insert_messages" on public.service_messages
  for insert with check (true);

-- Realtime publication
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.service_messages;
