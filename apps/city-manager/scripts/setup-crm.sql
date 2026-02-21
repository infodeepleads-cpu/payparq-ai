-- Enable RLS
alter table if exists public.crm_contacts enable row level security;

-- Create the table if it doesn't exist
create table if not exists public.crm_contacts (
  id uuid default gen_random_uuid() primary key,
  tier integer,
  decision_maker text,
  location text,
  estimated_capacity integer,
  status text,
  next_step text,
  contract_type text,
  contract_action text,
  expiration_date timestamp with time zone,
  follow_up_date timestamp with time zone,
  no_reason text,
  restart_time timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default now()
);

-- Policies (Drop first to avoid errors on re-run)
drop policy if exists "Allow public insert crm" on public.crm_contacts;
drop policy if exists "Allow public select crm" on public.crm_contacts;
drop policy if exists "Allow public update crm" on public.crm_contacts;
drop policy if exists "Allow public delete crm" on public.crm_contacts;

create policy "Allow public insert crm" on public.crm_contacts for insert with check (true);
create policy "Allow public select crm" on public.crm_contacts for select using (true);
create policy "Allow public update crm" on public.crm_contacts for update using (true);
create policy "Allow public delete crm" on public.crm_contacts for delete using (true);
