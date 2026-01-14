-- Add Coordinates to Locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Refresh cache
NOTIFY pgrst, 'reload config';
