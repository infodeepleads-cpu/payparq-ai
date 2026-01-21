-- ULTIMATE STABILITY AND VISIBILITY FIX (v1.4.8)
-- Fixes: Profiles constraints, Trigger robustness, and Violation visibility for Admins.

-- 1. Profiles: Allow super_admin and Fix Constraints
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
  CHECK (role IN ('admin', 'officer', 'user', 'super_admin'));

-- 2. Robust handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    -- Fallback if generate_location_id doesn't exist, use random 5-digit
    BEGIN
      new_loc_id := generate_location_id();
    EXCEPTION WHEN OTHERS THEN
      new_loc_id := floor(random() * 90000 + 10000)::TEXT;
    END;
  END IF;

  INSERT INTO public.profiles (id, email, role, location_id, full_name)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id, full_name)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    location_id = COALESCE(profiles.location_id, EXCLUDED.location_id),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    email = EXCLUDED.email;
  
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Simplified and Robust Violations RLS
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

-- 4. Sync metadata for all users again to be safe
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
