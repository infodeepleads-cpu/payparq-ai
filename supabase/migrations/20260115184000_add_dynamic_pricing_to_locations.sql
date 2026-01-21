-- Migration to add dynamic pricing columns to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS base_price_daily numeric DEFAULT 0.00;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS base_price_monthly numeric DEFAULT 0.00;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS dynamic_pricing_enabled boolean DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS dynamic_pricing_ratio numeric DEFAULT 1.0;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS surcharge_enabled boolean DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS surcharge_multiplier numeric DEFAULT 1.0;
