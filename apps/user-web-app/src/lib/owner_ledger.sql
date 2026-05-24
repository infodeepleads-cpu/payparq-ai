-- Owner bank details (add to profiles table)
alter table profiles
  add column if not exists bank_iban text,
  add column if not exists bank_account_holder text,
  add column if not exists bank_country text default 'HR',
  add column if not exists bank_details_updated_at timestamptz;

-- Owner ledger: tracks earnings per booking
create table if not exists owner_ledger (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  location_id text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  charged_amount_cents integer not null default 0,
  stripe_fee_cents integer not null default 0,
  service_fee_cents integer not null default 0,
  commission_rate numeric(5,4) not null default 0,
  owner_reserved_cents integer not null default 0,
  payparq_reserved_cents integer not null default 0,
  flow_type text,
  pricing_type text,
  check_in text,
  check_out text,
  status text not null default 'reserved' check (status in ('reserved', 'allocated', 'paid')),
  payout_id uuid,
  created_at timestamptz default now()
);

-- Payout batches: tracks each payout event
create table if not exists owner_payouts (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  owner_amount_cents integer not null default 0,
  payparq_amount_cents integer not null default 0,
  stripe_payout_id text,
  bank_iban text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  notes text,
  processed_by text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- RLS
alter table owner_ledger enable row level security;
alter table owner_payouts enable row level security;

create policy "Owners can view own ledger"
  on owner_ledger for select
  using (owner_id = auth.uid());

create policy "Service role can manage ledger"
  on owner_ledger for all
  using (auth.role() = 'service_role');

create policy "Owners can view own payouts"
  on owner_payouts for select
  using (owner_id = auth.uid());

create policy "Service role can manage payouts"
  on owner_payouts for all
  using (auth.role() = 'service_role');
