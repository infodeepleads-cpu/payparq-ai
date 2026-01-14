-- Add missing columns to locations table to support mobile scanner app
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS display_id text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS capacity int DEFAULT 0;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rate_per_hour numeric DEFAULT 0.00;

-- Ensure RLS is disabled as requested for the prototype phase
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
