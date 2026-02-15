-- Add Stripe Connect fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Express Account ID for guest payouts';
COMMENT ON COLUMN public.profiles.stripe_onboarding_complete IS 'Whether the user has finished Stripe onboarding';
COMMENT ON COLUMN public.profiles.stripe_payouts_enabled IS 'Whether payouts are enabled for this account';
