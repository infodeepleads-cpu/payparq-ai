-- Create email_sequences table for managing sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_name ON email_sequences(name);

-- Disable RLS so service role can access
ALTER TABLE email_sequences DISABLE ROW LEVEL SECURITY;
