-- Fix RLS Recursion and Robust Signup Trigger
-- 1. Helper function to check role without recursion (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Simplified handle_new_user with conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
BEGIN
  -- Default role is admin unless specified in metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  
  -- If it's a new admin signup, they need a location_id
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := generate_unique_display_id();
  END IF;

  -- Create profile with ON CONFLICT ignore to prevent signup failure if record exists
  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    location_id = COALESCE(public.profiles.location_id, EXCLUDED.location_id);
  
  -- Create initial location only for new admins
  IF user_role = 'admin' AND NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
    INSERT INTO public.locations (name, display_id, owner_id)
    VALUES ('My First Lot', new_loc_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies to use non-recursive role check
-- Profiles
DROP POLICY IF EXISTS "Profiles_Isolation" ON public.profiles;
CREATE POLICY "Profiles_Isolation" ON public.profiles
  FOR ALL USING (
    get_auth_role() = 'super_admin' OR
    id = auth.uid() OR
    location_id = (SELECT p.location_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Locations
DROP POLICY IF EXISTS "Locations_Isolation" ON public.locations;
CREATE POLICY "Locations_Isolation" ON public.locations
  FOR ALL USING (
    get_auth_role() = 'super_admin' OR
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'officer' AND p.location_id = public.locations.display_id)
  );

-- Sessions
DROP POLICY IF EXISTS "Sessions_Isolation" ON public.parking_sessions;
CREATE POLICY "Sessions_Isolation" ON public.parking_sessions
  FOR ALL USING (
    get_auth_role() = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id::TEXT = public.parking_sessions.location_id::TEXT
      AND (
        l.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'officer' AND p.location_id = l.display_id)
      )
    )
  );

-- Permits
DROP POLICY IF EXISTS "Permits_Isolation" ON public.parking_permits;
CREATE POLICY "Permits_Isolation" ON public.parking_permits
  FOR ALL USING (
    get_auth_role() = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id::TEXT = public.parking_permits.location_id::TEXT
      AND (
        l.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'officer' AND p.location_id = l.display_id)
      )
    )
  );
