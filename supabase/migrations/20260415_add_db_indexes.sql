-- Hot-path indexes for PayParq production queries
-- All are CREATE INDEX IF NOT EXISTS — safe to apply multiple times, no downtime risk on small tables,
-- Postgres builds them without locking reads/writes (CONCURRENT not needed at current scale).

-- parking_sessions: most queries filter by location_id + status or payment_status
CREATE INDEX IF NOT EXISTS idx_parking_sessions_location_id
  ON public.parking_sessions (location_id);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_location_status
  ON public.parking_sessions (location_id, status);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_location_payment_status
  ON public.parking_sessions (location_id, payment_status);

-- plate lookups for session dedup and scanner verification
CREATE INDEX IF NOT EXISTS idx_parking_sessions_plate
  ON public.parking_sessions (plate);

-- entry_time DESC used in most list queries
CREATE INDEX IF NOT EXISTS idx_parking_sessions_entry_time
  ON public.parking_sessions (entry_time DESC);

-- parking_permits: location scoped listing + plate lookups
CREATE INDEX IF NOT EXISTS idx_parking_permits_location_id
  ON public.parking_permits (location_id);

CREATE INDEX IF NOT EXISTS idx_parking_permits_location_status
  ON public.parking_permits (location_id, status);

CREATE INDEX IF NOT EXISTS idx_parking_permits_plate
  ON public.parking_permits (plate);

-- violations: list ordered by issued_at per location (most common view)
CREATE INDEX IF NOT EXISTS idx_violations_location_issued_at
  ON public.violations (location_id, issued_at DESC);

-- per-officer queries (uploaded_by)
CREATE INDEX IF NOT EXISTS idx_violations_uploaded_by
  ON public.violations (uploaded_by);

-- officer_assignments: access control — checked on every RLS can_access_location() call
CREATE INDEX IF NOT EXISTS idx_officer_assignments_officer_id
  ON public.officer_assignments (officer_id);

CREATE INDEX IF NOT EXISTS idx_officer_assignments_location_id
  ON public.officer_assignments (location_id);

-- profiles: role-based queries (used in can_access_location fallback)
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

-- locations: display_id lookups (used in plate scanner and case numbering trigger)
CREATE INDEX IF NOT EXISTS idx_locations_display_id
  ON public.locations (display_id);

-- locations: owner_id used in RLS owner check path
CREATE INDEX IF NOT EXISTS idx_locations_owner_id
  ON public.locations (owner_id);
