-- Email Sequences for Airbnb Hosts (3-email campaign)
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email_count INT DEFAULT 3,
  target_segment VARCHAR(100), -- 'hotel', 'boutique', 'apartment', 'villa'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual sequence emails
CREATE TABLE IF NOT EXISTS sequence_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  email_number INT NOT NULL, -- 1, 2, 3
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  delay_hours INT, -- delay between previous email
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sequence_id, email_number)
);

-- Lead database with tracking
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  property_type VARCHAR(100), -- 'hotel', 'apartment', 'villa', 'boutique'
  estimated_parking_spots INT,
  airbnb_url VARCHAR(500),
  data_source VARCHAR(100), -- 'google_maps', 'apollo', 'linkedin', 'api'
  contact_status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'engaged', 'converted', 'unsubscribed'
  tags JSONB, -- for segmentation
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_email_leads_email (email),
  INDEX idx_email_leads_property_type (property_type),
  INDEX idx_email_leads_contact_status (contact_status)
);

-- Campaign enrollments (tracking sequence progress)
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES email_leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  email_number INT, -- which email in sequence (1, 2, 3)
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'opened', 'clicked', 'bounced'
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  bounced_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_sequence_enrollments_status (status),
  INDEX idx_sequence_enrollments_sent_at (sent_at),
  UNIQUE(lead_id, sequence_id, email_number)
);

-- Resend queue (for continuous auto-send)
CREATE TABLE IF NOT EXISTS email_resend_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_resend_queue_scheduled (scheduled_for),
  INDEX idx_resend_queue_status (status)
);

-- Email performance tracking
CREATE TABLE IF NOT EXISTS email_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id),
  email_number INT,
  total_sent INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sequence_id, email_number)
);

-- Audit log for email sends
CREATE TABLE IF NOT EXISTS email_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id),
  event_type VARCHAR(50), -- 'sent', 'opened', 'clicked', 'bounced'
  event_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  additional_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_audit_log_event_type (event_type),
  INDEX idx_audit_log_timestamp (event_timestamp)
);

-- Row-level security policies
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_resend_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON email_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'super_admin'))
);

CREATE POLICY "superadmin_all" ON sequence_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'super_admin'))
);

CREATE POLICY "superadmin_all" ON email_resend_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'super_admin'))
);
