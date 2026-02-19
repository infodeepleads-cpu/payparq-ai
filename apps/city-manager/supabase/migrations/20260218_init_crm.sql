-- Create CRM schema
-- Tiers:
-- 1: Airport land
-- 2: Empty land (City lots)
-- 3: Crowded Lots (Restaurants/Bars/Bakeries/Small Shops)
-- 4: Villas / Apartments
-- 5: Single-power owners (Lots, Garages, Multi Building-Owners)
-- 6: Hotels
-- 7: Whales (corporations / multi-decision)

-- Create enum type if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_decision_status') then
    create type public.crm_decision_status as enum (
      'entry_demo',
      'yes',
      'no',
      'follow_up'
    );
  end if;
end$$;

create table if not exists public.crm_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  decision_maker text,
  city text,
  tier smallint check (tier between 1 and 7),
  estimated_capacity int,
  decision_status public.crm_decision_status default 'entry_demo',
  rejection_reason text, -- For 'no(WHY)'
  cooldown_until timestamptz,
  notes text,
  
  -- Integrations (placeholders)
  stripe_customer_id text,
  
  -- Metadata
  created_by uuid references auth.users(id), -- Optional: to track who created it
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.crm_organizations enable row level security;

-- Policies
-- Adjust these based on your actual auth roles (e.g., allow 'service_role' or specific email domains)
create policy "Authenticated users can view organizations"
  on public.crm_organizations for select
  to authenticated
  using (true);

create policy "Authenticated users can insert organizations"
  on public.crm_organizations for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update organizations"
  on public.crm_organizations for update
  to authenticated
  using (true);

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.crm_organizations;
create trigger set_updated_at
  before update on public.crm_organizations
  for each row
  execute function public.handle_updated_at();

-- Comment on table to document tiers
comment on column public.crm_organizations.tier is 
'1: Airport land, 2: Empty land, 3: Crowded Lots, 4: Villas/Apts, 5: Single-power owners, 6: Hotels, 7: Whales';
