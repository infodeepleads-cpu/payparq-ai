-- THE NUCLEAR RLS FIX: ELIMINATING RECURSION VIA JWT METADATA

-- 1. Update handle_new_user to sync role/location to auth metadata
-- This ensures the JWT contains the information needed for RLS without querying tables.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  
  -- Auto-generate location ID for new admins if missing
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := public.generate_unique_display_id();
  END IF;

  -- Update auth metadata so it's available in auth.jwt()
  UPDATE auth.users 
  SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object('role', user_role, 'location_id', new_loc_id)
  WHERE id = NEW.id;

  -- Create profile record
  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    location_id = COALESCE(public.profiles.location_id, EXCLUDED.location_id),
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  
  -- Create initial location if admin
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My First Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Repair existing users metadata
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN (SELECT id, role, location_id FROM public.profiles) LOOP
    UPDATE auth.users 
    SET raw_user_meta_data = 
      raw_user_meta_data || 
      jsonb_build_object('role', u.role, 'location_id', u.location_id)
    WHERE id = u.id;
  END LOOP;
END $$;

-- 3. DROP ALL RECURSIVE POLICIES
DROP POLICY IF EXISTS "Profiles_Isolation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Self_Access" ON public.profiles;
DROP POLICY IF EXISTS "Locations_Isolation" ON public.locations;
DROP POLICY IF EXISTS "Sessions_Isolation" ON public.parking_sessions;
DROP POLICY IF EXISTS "Violations_Isolation" ON public.violations;

-- 4. REWRITE POLICIES USING JWT METADATA (NON-RECURSIVE)

-- Profiles
CREATE POLICY "Profiles_Isolation_v3" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    id = auth.uid() OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Locations
CREATE POLICY "Locations_Isolation_v3" ON public.locations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id OR 
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Sessions
CREATE POLICY "Sessions_Isolation_v3" ON public.parking_sessions
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Violations
CREATE POLICY "Violations_Isolation_v3" ON public.violations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );
