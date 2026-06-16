-- Create CRM entries table
create table if not exists crm_entries (
  id text primary key,
  company text not null,
  contact text,
  status text,
  next_action text,
  date text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index for faster queries
create index if not exists crm_entries_company_idx on crm_entries(company);
create index if not exists crm_entries_status_idx on crm_entries(status);

-- Enable RLS if needed
alter table crm_entries enable row level security;
