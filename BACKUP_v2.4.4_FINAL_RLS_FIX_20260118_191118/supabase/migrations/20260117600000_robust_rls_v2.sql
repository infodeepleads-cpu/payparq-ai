-- ROBUST RLS FOR LOCATIONS AND STAFF (V2)
-- Splitting policies by command to ensure INSERT works correctly for Admins.

-- 1. DROP existing messy policy
DROP POLICY IF EXISTS "Locations_JWT_Access" ON public.locations;
DROP POLICY IF EXISTS "Locations_Select" ON public.locations;
DROP POLICY IF EXISTS "Locations_Insert" ON public.locations;
DROP POLICY IF EXISTS "Locations_Update" ON public.locations;
DROP POLICY IF EXISTS "Locations_Delete" ON public.locations;

-- 2. CREATE explicit policies for Locations
CREATE POLICY "Locations_Select" ON public.locations
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id OR 
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    display_id IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );

CREATE POLICY "Locations_Insert" ON public.locations
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id
  );

CREATE POLICY "Locations_Update" ON public.locations
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id
  );

CREATE POLICY "Locations_Delete" ON public.locations
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id
  );

-- 3. ENSURE ALL ADMINS HAVE THE ROLE IN METADATA
-- Using profiles as source of truth to sync auth.users metadata.
-- This ensures JWT checks work without hitting the database.
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN (SELECT id, role, location_id FROM public.profiles WHERE role IN ('admin', 'super_admin')) LOOP
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', u.role, 'location_id', u.location_id)
    WHERE id = u.id;
  END LOOP;
END $$;
