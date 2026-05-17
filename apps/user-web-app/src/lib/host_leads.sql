-- Host Registration Leads table
CREATE TABLE IF NOT EXISTS host_registration_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_host_leads_email ON host_registration_leads(email);
CREATE INDEX IF NOT EXISTS idx_host_leads_created ON host_registration_leads(created_at DESC);

-- RLS Policies (allow service role to insert/read)
ALTER TABLE host_registration_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) to manage all rows
CREATE POLICY "service_role_manage_leads" ON host_registration_leads
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
