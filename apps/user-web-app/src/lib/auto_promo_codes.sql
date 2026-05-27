-- Auto Promo Codes Table
CREATE TABLE IF NOT EXISTS auto_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auto_promo_codes_location_id ON auto_promo_codes(location_id);
CREATE INDEX IF NOT EXISTS idx_auto_promo_codes_code ON auto_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_auto_promo_codes_expires_at ON auto_promo_codes(expires_at);
