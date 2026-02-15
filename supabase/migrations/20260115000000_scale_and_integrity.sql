-- SCALE & INTEGRITY REFACTOR
-- Run this in your Supabase SQL Editor

-- 1. Ensure idempotency at the database level
-- This is critical for high-scale webhooks to prevent duplicate sessions
ALTER TABLE parking_sessions 
ADD CONSTRAINT unique_stripe_session_id UNIQUE (stripe_session_id);

-- 2. Fast Lookup Indexes
-- Indexing for high-speed enforcement checks and dashboard filtering
CREATE INDEX IF NOT EXISTS idx_sessions_plate_active ON parking_sessions (plate) 
WHERE payment_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_permits_plate_active ON parking_permits (plate) 
WHERE status = 'active';

-- 3. Cleanup & Optimization
-- Analyze the tables to optimize the query planner
ANALYZE parking_sessions;
ANALYZE parking_permits;
ANALYZE locations;

-- 4. Global Error Logging (Optional but recommended)
-- Create a log table for system-wide debugging if not already present
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    module TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index logs for fast troubleshooting
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON system_logs (created_at DESC);
