create table if not exists public.wallet_accounts (
  email text primary key,
  balance_cents bigint not null default 0,
  currency text not null default 'eur',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id bigserial primary key,
  email text not null,
  amount_cents bigint not null,
  direction text not null check (direction in ('credit', 'debit')),
  entry_type text not null,
  stripe_session_id text,
  parking_session_id uuid,
  location_id text,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wallet_ledger_email_created_at_idx
  on public.wallet_ledger (email, created_at desc);

create table if not exists public.loyalty_accounts (
  email text primary key,
  points_year integer not null default 0,
  points_total integer not null default 0,
  current_level text not null default 'level_1',
  year_start_date date not null default current_date,
  level_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_ledger (
  id bigserial primary key,
  email text not null,
  points_delta integer not null,
  source text not null default 'parking_session',
  stripe_session_id text,
  parking_session_id uuid,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_ledger_email_created_at_idx
  on public.loyalty_ledger (email, created_at desc);
