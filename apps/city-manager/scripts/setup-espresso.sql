-- Enable RLS for leads and tasks
alter table if exists public.leads enable row level security;
alter table if exists public.tasks enable row level security;

-- Create the leads table
create table if not exists public.leads (
  id text primary key,
  name text not null,
  type text,
  latitude double precision not null,
  longitude double precision not null,
  score integer default 0,
  source text default 'osm',
  address text,
  created_at timestamp with time zone not null default now()
);

-- Create the tasks table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  lead_id text references public.leads(id) on delete set null,
  due_at date not null,
  status text not null default 'pending',
  payload jsonb,
  created_at timestamp with time zone not null default now()
);

-- Create policies for leads (Public access for now, as per existing setup-crm.sql)
drop policy if exists "Allow public select leads" on public.leads;
drop policy if exists "Allow public insert leads" on public.leads;
drop policy if exists "Allow public update leads" on public.leads;
drop policy if exists "Allow public delete leads" on public.leads;

create policy "Allow public select leads" on public.leads for select using (true);
create policy "Allow public insert leads" on public.leads for insert with check (true);
create policy "Allow public update leads" on public.leads for update using (true);
create policy "Allow public delete leads" on public.leads for delete using (true);

-- Create policies for tasks
drop policy if exists "Allow public select tasks" on public.tasks;
drop policy if exists "Allow public insert tasks" on public.tasks;
drop policy if exists "Allow public update tasks" on public.tasks;
drop policy if exists "Allow public delete tasks" on public.tasks;

create policy "Allow public select tasks" on public.tasks for select using (true);
create policy "Allow public insert tasks" on public.tasks for insert with check (true);
create policy "Allow public update tasks" on public.tasks for update using (true);
create policy "Allow public delete tasks" on public.tasks for delete using (true);
