-- 1. Locations Table
create table if not exists public.locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  capacity int default 0,
  rate_per_hour numeric default 0.00,
  created_at timestamp with time zone default now()
);

-- 2. App Users (Staff) Table
-- This links to Supabase Auth (conceptually) but stores app-specific roles
create table if not exists public.app_users (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  role text not null check (role in ('admin', 'officer')),
  assigned_location_id uuid references public.locations(id),
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.locations enable row level security;
alter table public.app_users enable row level security;

-- Policies (Open for demo, restrict in prod)
create policy "Public read locations" on public.locations for select using (true);
create policy "Public insert locations" on public.locations for insert with check (true);
create policy "Public update locations" on public.locations for update using (true);

create policy "Public read app_users" on public.app_users for select using (true);
create policy "Public insert app_users" on public.app_users for insert with check (true);
create policy "Public update app_users" on public.app_users for update using (true);
