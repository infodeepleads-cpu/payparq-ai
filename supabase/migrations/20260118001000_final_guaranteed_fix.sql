-- v2.4.2: THE FINAL FIX - METADATA SYNC AND CLEAN RLS
-- This migration ensures that every user's role is in their JWT metadata,
-- which is the only reliable way to avoid RLS recursion in Supabase.

-- 1. Update the handle_new_user trigger to SYNC METADATA
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
  raw_pwd TEXT;
BEGIN
  -- Extract values
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'officer');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  raw_pwd := NEW.raw_user_meta_data->>'temp_password';
  
  -- Fallback for Admin location
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := floor(random() * 90000 + 10000)::TEXT;
  END IF;

  -- Insert into profiles
  INSERT INTO public.profiles (id, email, role, location_id, full_name, raw_password)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id, full_name, raw_pwd)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    location_id = COALESCE(profiles.location_id, EXCLUDED.location_id),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    email = EXCLUDED.email,
    raw_password = COALESCE(EXCLUDED.raw_password, profiles.raw_password);
  
  -- Ensure location exists for Admins
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;

  -- SYNC METADATA BACK TO AUTH.USERS (Crucial for JWT policies)
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', user_role, 'location_id', new_loc_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FORCE SYNC ALL EXISTING USERS
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

-- 3. CLEAN RLS (Non-Recursive, JWT-Based)
-- Drop all existing policies to start fresh
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

-- Profiles: Use JWT role for Super Admin, and ID for others.
CREATE POLICY "Profiles_Garanteed_Access" ON public.profiles
  FOR ALL USING (
    id = auth.uid() OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- Locations: Use JWT metadata or owner_id
CREATE POLICY "Locations_Garanteed_Access" ON public.locations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    owner_id = auth.uid() OR
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- Officer Assignments: Basic access
CREATE POLICY "Officer_Assignments_Garanteed_Access" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid()
  );

-- Sessions & Violations: Lot-based access via JWT
CREATE POLICY "Sessions_Garanteed_Access" ON public.parking_sessions
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Violations_Garanteed_Access" ON public.violations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid())
  );
