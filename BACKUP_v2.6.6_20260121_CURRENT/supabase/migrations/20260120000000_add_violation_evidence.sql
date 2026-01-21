-- Add evidence and scan type columns to violations table
ALTER TABLE public.violations ADD COLUMN IF NOT EXISTS evidence_r2_url TEXT;
ALTER TABLE public.violations ADD COLUMN IF NOT EXISTS is_lpr_scan BOOLEAN DEFAULT FALSE;

-- Reload PostgREST cache
NOTIFY pgrst, 'reload config';
