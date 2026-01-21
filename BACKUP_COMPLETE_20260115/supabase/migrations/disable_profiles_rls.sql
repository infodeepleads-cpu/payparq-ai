-- Fix 42P17: The recursion is actually in the 'profiles' table policies!
-- We need to disable RLS on profiles as well.

alter table public.profiles disable row level security;

-- Drop the recursive policies just in case RLS gets re-enabled
drop policy if exists "Admins view all profiles" on public.profiles;
drop policy if exists "Users view own profile" on public.profiles;
