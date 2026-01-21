-- Migration to unify autopilot toggle
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS autopilot_enabled boolean DEFAULT false;
