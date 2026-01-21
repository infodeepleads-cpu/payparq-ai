-- Fix: Change location_id from UUID to TEXT to support Stripe short-codes and external IDs
-- 1. Drop the foreign key constraint first
ALTER TABLE parking_sessions DROP CONSTRAINT IF EXISTS parking_sessions_location_id_fkey;

-- 2. Change the column type to TEXT
ALTER TABLE parking_sessions ALTER COLUMN location_id TYPE TEXT;

-- 3. Make it optional (NULL) to prevent crashes if Stripe data is missing it
ALTER TABLE parking_sessions ALTER COLUMN location_id DROP NOT NULL;

-- 4. Do the same for parking_permits if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_permits' AND column_name = 'location_id') THEN
        ALTER TABLE parking_permits DROP CONSTRAINT IF EXISTS parking_permits_location_id_fkey;
        ALTER TABLE parking_permits ALTER COLUMN location_id TYPE TEXT;
        ALTER TABLE parking_permits ALTER COLUMN location_id DROP NOT NULL;
    END IF;
END $$;
