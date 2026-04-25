-- Parking reviews table
create table if not exists public.parking_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  location_id uuid references public.locations(id) on delete set null,
  member_email text,
  review_token text unique not null,
  score_security smallint check (score_security between 1 and 10),
  score_accessibility smallint check (score_accessibility between 1 and 10),
  score_cleanliness smallint check (score_cleanliness between 1 and 10),
  score_staff smallint check (score_staff between 1 and 10),
  score_value smallint check (score_value between 1 and 10),
  score_location smallint check (score_location between 1 and 10),
  overall_score numeric(4,2),
  comment text,
  submitted_at timestamptz,
  email_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists parking_reviews_location_id_idx on public.parking_reviews(location_id);
create index if not exists parking_reviews_token_idx on public.parking_reviews(review_token);
create index if not exists parking_reviews_email_idx on public.parking_reviews(member_email);

-- Add review aggregate columns to locations
alter table public.locations
  add column if not exists review_score numeric(4,2) default null,
  add column if not exists review_count int not null default 0,
  add column if not exists review_scores jsonb not null default '{}';

-- RLS: anyone can read reviews; only service role can insert/update
alter table public.parking_reviews enable row level security;
create policy "reviews_read" on public.parking_reviews for select using (true);
create policy "reviews_service_write" on public.parking_reviews for all using (auth.role() = 'service_role');
