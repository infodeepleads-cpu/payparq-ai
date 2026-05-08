-- Create public storage bucket for listing photos
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own listing folders
create policy "Authenticated users can upload listing photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-photos');

-- Allow public read access to listing photos
create policy "Public read access for listing photos"
on storage.objects for select
to public
using (bucket_id = 'listing-photos');

-- Allow authenticated users to delete their own listing photos
create policy "Authenticated users can delete listing photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-photos');
