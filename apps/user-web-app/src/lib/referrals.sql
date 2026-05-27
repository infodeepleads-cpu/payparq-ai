-- Referrals Table (tracks host earnings from promo codes)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL UNIQUE,
  location_id TEXT NOT NULL,
  promo_code_id UUID NOT NULL REFERENCES auto_promo_codes(id) ON DELETE CASCADE,
  referral_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (location_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_location_id ON referrals(location_id);
CREATE INDEX IF NOT EXISTS idx_referrals_promo_code_id ON referrals(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_booking_id ON referrals(booking_id);
