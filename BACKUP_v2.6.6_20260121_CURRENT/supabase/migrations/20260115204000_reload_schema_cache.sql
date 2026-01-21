-- Ensure the column exists and reload the PostgREST schema cache
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS autopilot_enabled boolean DEFAULT false;

-- Force reload of the schema cache
NOTIFY pgrst, 'reload config';
