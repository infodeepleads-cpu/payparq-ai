-- Force Add Missing Columns
-- If the table existed from an old migration, CREATE TABLE IF NOT EXISTS skipped these columns.
-- We must manually add them now.

ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 0;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rate_per_hour NUMERIC DEFAULT 0.00;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Force refresh cache again just in case
NOTIFY pgrst, 'reload config';
