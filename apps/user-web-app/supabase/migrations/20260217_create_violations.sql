
-- Create violations table
create table if not exists public.violations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  plate text not null,
  violation_type text,
  fine_amount numeric,
  status text default 'issued', -- 'issued', 'warning', 'paid', 'disputed'
  issued_at timestamp with time zone,
  evidence_r2_url text, -- path in storage bucket
  location_id uuid references public.locations(id),
  is_lpr_scan boolean default false,
  issuer_role text
);

-- Enable RLS
alter table public.violations enable row level security;

-- Policies
create policy "Enable read access for all users" on public.violations for select using (true);
create policy "Enable insert for authenticated users only" on public.violations for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.violations for update using (auth.role() = 'authenticated');

-- Storage Bucket setup
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'evidence' );

create policy "Authenticated Insert"
  on storage.objects for insert
  with check ( bucket_id = 'evidence' and auth.role() = 'authenticated' );
