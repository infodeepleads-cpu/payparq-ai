-- Add daily_duration_hours for Subscriptions (1-24 hours)
alter table public.parking_permits 
add column if not exists daily_duration_hours int default 24 check (daily_duration_hours between 1 and 24);
