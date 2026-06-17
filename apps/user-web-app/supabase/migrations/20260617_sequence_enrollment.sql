-- Track which email in sequence each lead is on
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sequence_id TEXT NOT NULL,
  sequence_name TEXT NOT NULL,
  current_email_number INTEGER DEFAULT 1,
  total_emails INTEGER DEFAULT 4,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, paused, completed, bounced
  opened_emails TEXT[] DEFAULT '{}', -- Array of email numbers opened
  clicked_emails TEXT[] DEFAULT '{}', -- Array of email numbers clicked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipient_email, sequence_id)
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_email ON sequence_enrollments(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_send ON sequence_enrollments(next_send_at);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status);

-- Disable RLS
ALTER TABLE sequence_enrollments DISABLE ROW LEVEL SECURITY;
