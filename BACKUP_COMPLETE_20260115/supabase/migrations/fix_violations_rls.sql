-- Fix 42501 (Permission Denied) on 'violations' table

-- 1. Enable RLS (Good practice, though likely already on)
alter table public.violations enable row level security;

-- 2. Drop existing policies to be safe
drop policy if exists "Enable read access for all users" on public.violations;
drop policy if exists "Enable insert access for all users" on public.violations;

-- 3. Policy: Allow anyone (anon + auth) to READ violations
create policy "Enable read access for all users"
on public.violations for select
using (true);

-- 4. Policy: Allow anyone (anon + auth) to INSERT violations
-- (In prod, you might restrict this to authenticated officers only)
create policy "Enable insert access for all users"
on public.violations for insert
with check (true);
