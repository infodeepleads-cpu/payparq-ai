-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Progress Table
create table if not exists user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_tier int default 1,
  tiers_completed jsonb default '{}'::jsonb,
  ultra_mode boolean default false,
  updated_at timestamptz default now()
);

-- Document Submissions Table
create table if not exists document_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  tier int not null,
  type text not null, -- 'airport', 'stakeholder'
  content text, -- JSON or text content
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add user_id to CRM Contacts if not exists
alter table crm_contacts add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Add user_id to Emails if not exists
alter table emails add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- RLS Policies (Row Level Security)

-- Enable RLS
alter table user_progress enable row level security;
alter table document_submissions enable row level security;
alter table crm_contacts enable row level security;
alter table emails enable row level security;

-- User Progress Policies
create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);

create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all progress" on user_progress
  for select using (auth.email() = 'payparq@outlook.com');

create policy "Admins can update all progress" on user_progress
  for update using (auth.email() = 'payparq@outlook.com');

-- Document Submission Policies
create policy "Users can view own submissions" on document_submissions
  for select using (auth.uid() = user_id);

create policy "Users can insert own submissions" on document_submissions
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all submissions" on document_submissions
  for select using (auth.email() = 'payparq@outlook.com');

create policy "Admins can update submissions" on document_submissions
  for update using (auth.email() = 'payparq@outlook.com');

-- CRM Policies
create policy "Users can view own contacts" on crm_contacts
  for select using (auth.uid() = user_id);

create policy "Users can insert own contacts" on crm_contacts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own contacts" on crm_contacts
  for update using (auth.uid() = user_id);

create policy "Users can delete own contacts" on crm_contacts
  for delete using (auth.uid() = user_id);

create policy "Admins can view all contacts" on crm_contacts
  for select using (auth.email() = 'payparq@outlook.com');

-- Email Policies
create policy "Users can view own emails" on emails
  for select using (auth.uid() = user_id);

create policy "Admins can view all emails" on emails
  for select using (auth.email() = 'payparq@outlook.com');
