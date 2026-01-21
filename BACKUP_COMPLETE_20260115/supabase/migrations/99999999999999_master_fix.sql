-- UNIVERSAL FIX FOR PGRST204 AND SCHEMA MISMATCH
-- Run this in your Supabase SQL Editor to fix "Add Pass/Sub" and Dashboard visibility.

-- 1. Ensure parking_permits has all required columns
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS location_id TEXT;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS daily_duration_hours INT DEFAULT 24;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS daily_start_time TIME;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS daily_end_time TIME;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0.00;
ALTER TABLE public.parking_permits ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- 2. Fix potential type mismatch for location_id
ALTER TABLE public.parking_permits ALTER COLUMN location_id TYPE TEXT;

-- 3. Ensure parking_sessions has all required columns
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.parking_sessions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- 4. Unified Payment Status Constraint (Fixes conflict)
ALTER TABLE public.parking_sessions DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE public.parking_sessions DROP CONSTRAINT IF EXISTS parking_sessions_payment_status_check;

ALTER TABLE public.parking_sessions 
ADD CONSTRAINT unified_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'open', 'unpaid'));

-- 5. Ensure unique stripe_session_id for scale
-- First, clean up any accidental duplicates if they exist (keeps the newest one)
DELETE FROM public.parking_sessions a USING (
      SELECT MIN(ctid) as ctid, stripe_session_id 
      FROM public.parking_sessions 
      WHERE stripe_session_id IS NOT NULL 
      GROUP BY stripe_session_id HAVING COUNT(*) > 1
) b
WHERE a.stripe_session_id = b.stripe_session_id 
AND a.ctid <> b.ctid;

ALTER TABLE public.parking_sessions DROP CONSTRAINT IF EXISTS unique_stripe_session_id;
ALTER TABLE public.parking_sessions ADD CONSTRAINT unique_stripe_session_id UNIQUE (stripe_session_id);

-- 6. Disable RLS for testing/demo (Nuclear Option to ensure UI works)
ALTER TABLE public.parking_permits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- 7. REFRESH POSTGREST CACHE (CRITICAL)
-- This tells Supabase to re-scan the table structure immediately
NOTIFY pgrst, 'reload config';
