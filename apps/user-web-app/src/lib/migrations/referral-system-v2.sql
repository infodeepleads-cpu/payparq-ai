-- PayParq Referral System V2 Migration
-- Creates new tables for user codes, listing codes, and booking codes

-- 2. Listing referral codes (one per listing, auto-generated at creation, activated after approval)
CREATE TABLE IF NOT EXISTS referral_codes_listing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE, -- Format: CITY-TYPE-ID (e.g., DBK-CAR-482)
  listing_type VARCHAR(50), -- rent_a_car, hotel, parking_space, instant_listing
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_location_code UNIQUE(location_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_listing_location_id ON referral_codes_listing(location_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_listing_owner_id ON referral_codes_listing(owner_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_listing_code ON referral_codes_listing(code);

-- 3. Booking referral codes (each booking can have referral tracking)
CREATE TABLE IF NOT EXISTS booking_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL, -- parking_sessions.id
  referral_code VARCHAR(20) NOT NULL, -- Code used (references referral_codes_listing or user code)
  referrer_id UUID NOT NULL REFERENCES auth.users(id), -- Who gets the commission
  referrer_earning_cents INTEGER DEFAULT 0, -- 10% of booking amount
  traveler_discount_cents INTEGER DEFAULT 0, -- 10% discount given to user
  booking_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, payout_sent
  completed_at TIMESTAMP WITH TIME ZONE, -- When booking was completed
  payout_sent_at TIMESTAMP WITH TIME ZONE, -- When payout was distributed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_booking_referral UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_referral_codes_booking_id ON booking_referral_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_referral_codes_referrer_id ON booking_referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_booking_referral_codes_code ON booking_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_booking_referral_codes_status ON booking_referral_codes(booking_status);

-- 5. Add fields to existing locations table for referral integration
ALTER TABLE locations ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES referral_codes_listing(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_locations_referral_code_id ON locations(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_locations_referral_enabled ON locations(referral_enabled);

-- 6. Add fields to parking_sessions for referral tracking
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id);
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS referral_discount_cents INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_parking_sessions_referral_code ON parking_sessions(referral_code);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_referrer_id ON parking_sessions(referrer_id);

-- 7. Referral stats (aggregated for performance)
CREATE TABLE IF NOT EXISTS referral_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  location_id UUID REFERENCES locations(id),
  stats_type VARCHAR(20), -- 'user_code' or 'listing_code'
  total_bookings INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  total_traveler_savings_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_stats UNIQUE(user_id, stats_type),
  CONSTRAINT unique_listing_stats UNIQUE(location_id, stats_type)
);

CREATE INDEX IF NOT EXISTS idx_referral_stats_user_id ON referral_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_stats_location_id ON referral_stats(location_id);
