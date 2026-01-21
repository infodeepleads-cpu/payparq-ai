-- NUCLEAR POLICY RESET AND FIX
-- This script drops EVERYTHING and re-applies only the clean, non-recursive JWT-based policies.

-- 1. DROP ALL POLICIES on core tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'locations', 'parking_sessions', 'violations', 'officer_assignments')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. RE-APPLY JWT-BASED POLICIES (Garanteed Non-Recursive)

-- Profiles
CREATE POLICY "Profiles_JWT_Access" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    id = auth.uid() OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Locations
CREATE POLICY "Locations_JWT_Access" ON public.locations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id OR 
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    display_id IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );

-- Sessions
CREATE POLICY "Sessions_JWT_Access" ON public.parking_sessions
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Violations
CREATE POLICY "Violations_JWT_Access" ON public.violations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Officer Assignments
CREATE POLICY "Officer_Assignments_JWT_Access" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid()
  );

-- 3. ENSURE METADATA IS SYNCED FOR ALL USERS
-- This is critical for the JWT policies to work.
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN (SELECT id, role, location_id FROM public.profiles) LOOP
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', u.role, 'location_id', u.location_id)
    WHERE id = u.id;
  END LOOP;
END $$;
