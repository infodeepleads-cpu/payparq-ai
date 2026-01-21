-- Fix Infinite Recursion by cleaning up policies
-- It is likely there were conflicting policies or a self-referencing policy from a previous attempt

-- 1. Locations
alter table public.locations enable row level security;
drop policy if exists "Public read locations" on public.locations;
drop policy if exists "Public insert locations" on public.locations;
drop policy if exists "Public update locations" on public.locations;
drop policy if exists "Enable read access for all users" on public.locations;
drop policy if exists "Enable insert access for all users" on public.locations;
drop policy if exists "Enable update access for all users" on public.locations;

create policy "Public read locations" on public.locations for select using (true);
create policy "Public insert locations" on public.locations for insert with check (true);
create policy "Public update locations" on public.locations for update using (true);

-- 2. App Users
alter table public.app_users enable row level security;
drop policy if exists "Public read app_users" on public.app_users;
drop policy if exists "Public insert app_users" on public.app_users;
drop policy if exists "Public update app_users" on public.app_users;
drop policy if exists "Enable read access for all users" on public.app_users;
drop policy if exists "Enable insert access for all users" on public.app_users;
drop policy if exists "Enable update access for all users" on public.app_users;

create policy "Public read app_users" on public.app_users for select using (true);
create policy "Public insert app_users" on public.app_users for insert with check (true);
create policy "Public update app_users" on public.app_users for update using (true);
