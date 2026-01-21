-- 1. Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;

-- 3. Policy: Everyone can view (Public Read)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'evidence' );

-- 4. Policy: Authenticated users (or anon for demo) can upload
create policy "Authenticated Upload"
on storage.objects for insert
with check ( bucket_id = 'evidence' );
