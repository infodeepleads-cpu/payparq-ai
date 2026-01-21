-- 1. Performance Indexes for Scale
-- Optimize dashboard searches and webhook lookups
CREATE INDEX IF NOT EXISTS idx_sessions_plate ON parking_sessions (plate);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON parking_sessions (location_id);
CREATE INDEX IF NOT EXISTS idx_sessions_stripe_id ON parking_sessions (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON parking_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_permits_plate ON parking_permits (plate);
CREATE INDEX IF NOT EXISTS idx_permits_location ON parking_permits (location_id);
CREATE INDEX IF NOT EXISTS idx_permits_status ON parking_permits (status);

-- 2. Data Integrity Constraints
-- Ensure we don't have invalid payment statuses
ALTER TABLE parking_sessions 
DROP CONSTRAINT IF EXISTS check_payment_status;

ALTER TABLE parking_sessions 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('paid', 'unpaid', 'refunded'));

-- 3. Tighten RLS Security
-- Enable RLS on all core tables
ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing loose policies if they exist to replace them
DROP POLICY IF EXISTS "Public Read Sessions" ON parking_sessions;
DROP POLICY IF EXISTS "Public Read Permits" ON parking_permits;
DROP POLICY IF EXISTS "Enable read for all users" ON parking_sessions;

-- NEW POLICIES: 
-- For a "World Class" app, we should ideally restrict read access to authenticated users or specific API keys.
-- However, for the current dashboard setup, we will keep them readable but strictly for SELECT.

CREATE POLICY "Allow public select on sessions" 
ON parking_sessions FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public select on permits" 
ON parking_permits FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public select on locations" 
ON locations FOR SELECT 
TO public 
USING (true);

-- 4. Scalable Realtime
-- Ensure tables are in the realtime publication
BEGIN;
  -- Remove and re-add to ensure clean state
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS parking_sessions, parking_permits, locations;
  ALTER PUBLICATION supabase_realtime ADD TABLE parking_sessions, parking_permits, locations;
COMMIT;
