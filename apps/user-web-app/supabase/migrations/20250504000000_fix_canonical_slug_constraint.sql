-- Fix canonical_slug NOT NULL constraint
-- This allows existing listings without canonical_slug to exist
ALTER TABLE locations ALTER COLUMN canonical_slug DROP NOT NULL;
