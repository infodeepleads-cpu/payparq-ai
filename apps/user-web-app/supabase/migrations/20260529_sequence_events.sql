CREATE TABLE IF NOT EXISTS email_sequence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email_id TEXT,
  occurred_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_seq_events_email ON email_sequence_events(recipient_email);
CREATE INDEX IF NOT EXISTS idx_seq_events_type ON email_sequence_events(event_type);
