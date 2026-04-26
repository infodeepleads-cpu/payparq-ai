-- 1. Add officer and city_manager roles to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'officer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'city_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'driver';

-- 2. Officer assignments (City Manager → Officers)
CREATE TABLE IF NOT EXISTS officer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(city_manager_id, officer_id, lot_id)
);

-- 3. Daily enforcement checkouts
CREATE TABLE IF NOT EXISTS enforcement_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  shift_start TIMESTAMP NOT NULL,
  shift_end TIMESTAMP,
  fines_count INT DEFAULT 0,
  tickets_issued INT DEFAULT 0,
  notes TEXT,
  enforcement_done_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Link violation_cases to enforcement_checkout
ALTER TABLE IF EXISTS violation_cases
ADD COLUMN IF NOT EXISTS enforcement_checkout_id UUID REFERENCES enforcement_checkouts(id) ON DELETE SET NULL;

-- 5. RLS Policies for officer_assignments
ALTER TABLE officer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_manager_view_own_officers" ON officer_assignments
FOR SELECT USING (auth.uid() = city_manager_id);

CREATE POLICY "officer_view_own_assignment" ON officer_assignments
FOR SELECT USING (auth.uid() = officer_id);

CREATE POLICY "city_manager_manage_officers" ON officer_assignments
FOR INSERT WITH CHECK (auth.uid() = city_manager_id);

-- 6. RLS Policies for enforcement_checkouts
ALTER TABLE enforcement_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "officer_view_own_checkouts" ON enforcement_checkouts
FOR SELECT USING (auth.uid() = officer_id);

CREATE POLICY "city_manager_view_officer_checkouts" ON enforcement_checkouts
FOR SELECT USING (
  officer_id IN (
    SELECT officer_id FROM officer_assignments
    WHERE city_manager_id = auth.uid()
  )
);

CREATE POLICY "officer_manage_own_checkouts" ON enforcement_checkouts
FOR INSERT WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "officer_update_own_checkouts" ON enforcement_checkouts
FOR UPDATE USING (auth.uid() = officer_id);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_assignments_city_manager ON officer_assignments(city_manager_id);
CREATE INDEX IF NOT EXISTS idx_officer_assignments_officer ON officer_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_checkouts_officer ON enforcement_checkouts(officer_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_checkouts_lot ON enforcement_checkouts(lot_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_checkouts_date ON enforcement_checkouts(shift_start);
