-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Document Submissions Table
create table if not exists document_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  tier int not null,
  type text not null, -- 'airport', 'stakeholder', 'permits', 'competition', 'lot_activation', 'hub_activation'
  content text, -- JSON or text content
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table document_submissions enable row level security;

-- Document Submission Policies
drop policy if exists "Users can view own submissions" on document_submissions;
create policy "Users can view own submissions" on document_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own submissions" on document_submissions;
create policy "Users can insert own submissions" on document_submissions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all submissions" on document_submissions;
create policy "Admins can view all submissions" on document_submissions
  for select using (auth.jwt() ->> 'email' = 'payparq@outlook.com');

drop policy if exists "Admins can update submissions" on document_submissions;
create policy "Admins can update submissions" on document_submissions
  for update using (auth.jwt() ->> 'email' = 'payparq@outlook.com');

-- User Progress Table
create table if not exists user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_tier int default 1,
  tiers_completed jsonb default '{}'::jsonb,
  ultra_mode boolean default false,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table user_progress enable row level security;

-- User Progress Policies
drop policy if exists "Users can view own progress" on user_progress;
create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on user_progress;
create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on user_progress;
create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all progress" on user_progress;
create policy "Admins can view all progress" on user_progress
  for select using (auth.jwt() ->> 'email' = 'payparq@outlook.com');

drop policy if exists "Admins can update all progress" on user_progress;
create policy "Admins can update all progress" on user_progress
  for update using (auth.jwt() ->> 'email' = 'payparq@outlook.com');
