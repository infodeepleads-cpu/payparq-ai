-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text,
  auth text,
  ua text,
  created_at timestamp with time zone not null default now()
);

-- Create reminders table
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  scheduled_at timestamp with time zone not null,
  fired boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.push_subscriptions enable row level security;
alter table public.reminders enable row level security;

-- Policies for push_subscriptions
create policy "Allow public insert to push_subscriptions"
  on public.push_subscriptions for insert
  with check (true);

create policy "Allow public select from push_subscriptions"
  on public.push_subscriptions for select
  using (true);

-- Policies for reminders
create policy "Allow public read reminders"
  on public.reminders for select
  using (true);

create policy "Allow public insert reminders"
  on public.reminders for insert
  with check (true);

create policy "Allow public update reminders"
  on public.reminders for update
  using (true);
