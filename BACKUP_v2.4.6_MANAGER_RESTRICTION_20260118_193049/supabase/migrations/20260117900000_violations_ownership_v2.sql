-- ROBUST OWNERSHIP-BASED RLS FOR VIOLATIONS AND SESSIONS (V2)
-- This fix uses explicit casting and reliable joins to ensure cross-lot management works.

-- 1. DROP old restrictive policies
DROP POLICY IF EXISTS "Sessions_Select" ON public.parking_sessions;
DROP POLICY IF EXISTS "Sessions_Insert" ON public.parking_sessions;
DROP POLICY IF EXISTS "Sessions_Update" ON public.parking_sessions;
DROP POLICY IF EXISTS "Violations_Select" ON public.violations;
DROP POLICY IF EXISTS "Violations_Insert" ON public.violations;
DROP POLICY IF EXISTS "Violations_Update" ON public.violations;

-- 2. PARKING SESSIONS: Dynamic Ownership Access
CREATE POLICY "Sessions_Select" ON public.parking_sessions
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.id::TEXT = parking_sessions.location_id::TEXT OR locations.display_id = parking_sessions.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    )
  );

CREATE POLICY "Sessions_Insert" ON public.parking_sessions
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.id::TEXT = parking_sessions.location_id::TEXT OR locations.display_id = parking_sessions.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    )
  );

CREATE POLICY "Sessions_Update" ON public.parking_sessions
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.id::TEXT = parking_sessions.location_id::TEXT OR locations.display_id = parking_sessions.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    )
  );

-- 3. VIOLATIONS: Dynamic Ownership Access
CREATE POLICY "Violations_Select" ON public.violations
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.display_id = violations.location_id::TEXT OR locations.id::TEXT = violations.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    ) OR
    violations.location_id::TEXT IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );

CREATE POLICY "Violations_Insert" ON public.violations
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.display_id = violations.location_id::TEXT OR locations.id::TEXT = violations.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    )
  );

CREATE POLICY "Violations_Update" ON public.violations
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.display_id = violations.location_id::TEXT OR locations.id::TEXT = violations.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    )
  );
