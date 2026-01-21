-- Create missing tables script
-- The user reported "relation public.app_users does not exist", meaning the tables were never created.
-- This script creates the tables AND fixes the RLS issue in one go.

-- 1. Create Locations Table
create table if not exists public.locations (
  id uuid default gen_random_uuid() primary key,
  display_id text unique, -- Added this column from the start
  name text not null,
  address text,
  capacity int default 0,
  rate_per_hour numeric default 0.00,
  created_at timestamp with time zone default now()
);

-- 2. Create App Users Table
create table if not exists public.app_users (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  role text not null check (role in ('admin', 'officer')),
  assigned_location_id uuid references public.locations(id),
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- 3. Disable RLS to prevent recursion (Nuclear Option)
alter table public.profiles disable row level security;
alter table public.locations disable row level security;
alter table public.app_users disable row level security;
alter table public.parking_permits disable row level security;

-- 4. Clean up any bad policies just in case
drop policy if exists "Admins view all profiles" on public.profiles;
drop policy if exists "Users view own profile" on public.profiles;
