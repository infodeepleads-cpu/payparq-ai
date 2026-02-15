-- Add ceiling columns for Smart AutoPilot constraints
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS rate_per_hour_ceiling double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_price_daily_ceiling double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_price_monthly_ceiling double precision DEFAULT 0;
