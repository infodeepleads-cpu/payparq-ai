-- REVAMP: MANAGER ROLE AND MULTI-LOT BINDING (v1.7.0)
-- This adds the 'manager' role and ensures they can access multiple assigned lots.

-- 1. Profiles: Add 'manager' to role check
DO $$
DECLARE
    const_name TEXT;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%';
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(const_name);
    END IF;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'officer', 'user', 'super_admin', 'manager'));

-- 2. Update Violations RLS to include managers and officer_assignments
DROP POLICY IF EXISTS "Violations_Select" ON public.violations;
DROP POLICY IF EXISTS "Violations_Insert" ON public.violations;
DROP POLICY IF EXISTS "Violations_Update" ON public.violations;

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
    ) OR
    violations.location_id::TEXT IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );

CREATE POLICY "Violations_Update" ON public.violations
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE (locations.display_id = violations.location_id::TEXT OR locations.id::TEXT = violations.location_id::TEXT)
      AND (locations.owner_id = auth.uid() OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    ) OR
    violations.location_id::TEXT IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );

-- 3. Update Locations RLS to ensure managers can see assigned lots
DROP POLICY IF EXISTS "Locations_Officer_Read" ON public.locations;
CREATE POLICY "Locations_Staff_Read" ON public.locations
  FOR SELECT USING (
    display_id IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );
