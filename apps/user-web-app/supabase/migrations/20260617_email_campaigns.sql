-- Create email_campaigns table for A/B testing
CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY,
  variant_a_subject TEXT NOT NULL,
  variant_a_body TEXT NOT NULL,
  variant_b_subject TEXT NOT NULL,
  variant_b_body TEXT NOT NULL,
  variant_a_sent_count INTEGER DEFAULT 0,
  variant_b_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_campaign_events table to track opens, clicks, bounces
CREATE TABLE IF NOT EXISTS email_campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES email_campaigns(id),
  recipient_email TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'bounced')),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, recipient_email, event_type, variant)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaign_events_campaign ON email_campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_events_variant ON email_campaign_events(variant);
CREATE INDEX IF NOT EXISTS idx_email_campaign_events_type ON email_campaign_events(event_type);

-- Disable RLS so service role can access
ALTER TABLE email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_events DISABLE ROW LEVEL SECURITY;
