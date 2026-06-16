-- Create CRM entries table
CREATE TABLE IF NOT EXISTS crm_entries (
  id text PRIMARY KEY,
  company text NOT NULL,
  contact text,
  status text,
  next_action text,
  date text,
  notes text,
  city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_entries_company_idx ON crm_entries(company);
CREATE INDEX IF NOT EXISTS crm_entries_city_idx ON crm_entries(city);
CREATE INDEX IF NOT EXISTS crm_entries_status_idx ON crm_entries(status);

-- Disable RLS so service role can access without policies
ALTER TABLE crm_entries DISABLE ROW LEVEL SECURITY;
