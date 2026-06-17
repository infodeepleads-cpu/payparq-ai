-- Email sends tracking
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id TEXT NOT NULL,
  enrollment_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  email_number INTEGER NOT NULL,
  language TEXT NOT NULL, -- 'hr', 'en', 'de', 'it', 'fr'
  subject TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'bounced', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email replies tracking
CREATE TABLE IF NOT EXISTS email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  reply_from TEXT,
  reply_subject TEXT,
  reply_body TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add pause tracking to sequence_enrollments (if not exists)
ALTER TABLE sequence_enrollments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reply_detected_at TIMESTAMP;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_sends_enrollment ON email_sends(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient ON email_sends(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_replies_enrollment ON email_replies(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_detected_at ON email_replies(detected_at);
