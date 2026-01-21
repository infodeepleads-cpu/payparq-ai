-- Migration to add autopilot columns to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS dynamic_autopilot boolean DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS surcharge_autopilot boolean DEFAULT false;
