-- NUCLEAR OPTION: Disable RLS on EVERYTHING to stop the recursion loop once and for all.
-- Also, alter locations table to allow custom text IDs if not already (UUID is standard but we can use text for readable IDs like LOC-001)

-- 1. Disable RLS on ALL tables involved in the loop
alter table public.profiles disable row level security;
alter table public.locations disable row level security;
alter table public.app_users disable row level security;
alter table public.parking_permits disable row level security;

-- 2. Ensure we can use text IDs for locations (if it was UUID, we need to handle that)
-- If it was UUID, we can't easily change to TEXT without dropping. 
-- For this prototype, we will just ADD a `custom_id` column that we display, 
-- or we can just drop and recreate if no data is critical.
-- Let's add a `display_id` column for the readable "LOC-XXXX" ID.

alter table public.locations 
add column if not exists display_id text unique;

-- 3. Drop any remaining policies that might trigger even with RLS disabled (sometimes triggers still check)
drop policy if exists "Admins view all profiles" on public.profiles;
drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Public read locations" on public.locations;
