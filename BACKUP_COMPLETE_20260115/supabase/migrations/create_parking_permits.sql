-- Create table for parking permits (Passes & Subscriptions)
create table if not exists public.parking_permits (
  id uuid default gen_random_uuid() primary key,
  plate text not null,
  type text not null check (type in ('pass', 'subscription')),
  
  -- For both: Valid date range
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  
  -- For Subscriptions: Daily access window (e.g. 08:00 to 18:00)
  -- If null, assumes 24/7 access
  daily_start_time time,
  daily_end_time time,
  
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  contact_name text,
  contact_phone text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.parking_permits enable row level security;

-- Policies
create policy "Enable read access for all users"
on public.parking_permits for select
using (true);

create policy "Enable insert access for all users"
on public.parking_permits for insert
with check (true);

create policy "Enable update access for all users"
on public.parking_permits for update
using (true);
