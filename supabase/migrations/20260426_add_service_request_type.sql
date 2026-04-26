-- Add type and customer_email to ride_requests
-- type: 'ride' (default, driver flow) | 'valet' | 'shuttle' (officer flow)
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'ride',
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_ride_requests_type ON ride_requests(type);
