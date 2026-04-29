-- Email campaigns table
create table email_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  html_content text not null,
  recipient_list text default 'all',
  status text default 'draft',
  recipient_count int default 0,
  open_rate int default 0,
  click_rate int default 0,
  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  scheduled_at timestamp,
  sent_at timestamp
);

-- Email recipients (property owners)
create table email_recipients (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  property_type text,
  location text,
  added_at timestamp default now()
);

-- Campaign analytics
create table email_campaign_analytics (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references email_campaigns(id),
  recipient_email text,
  opened_at timestamp,
  clicked_at timestamp,
  created_at timestamp default now()
);
