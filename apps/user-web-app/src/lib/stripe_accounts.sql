create table if not exists stripe_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_account_id text,
  is_connected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table stripe_accounts enable row level security;

create policy "Users can view own stripe account"
  on stripe_accounts for select
  using (auth.uid() = user_id);

create policy "Users can upsert own stripe account"
  on stripe_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stripe account"
  on stripe_accounts for update
  using (auth.uid() = user_id);
