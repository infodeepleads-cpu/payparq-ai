-- v2.3.1: GUARANTEED STAFF VISIBILITY FIX
-- This migration fixes the RLS policies to ensure Super Admins see everything
-- and Admins see their staff regardless of assignment table latency.

-- 1. Create a helper function to get the current user's role reliably
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Update Profiles RLS
DROP POLICY IF EXISTS "Profiles_Staff_Access_v3" ON public.profiles;
CREATE POLICY "Profiles_Staff_Access_v4" ON public.profiles
  FOR ALL USING (
    -- Super Admins see everything
    public.get_my_role() = 'super_admin' OR
    -- Users see themselves
    id = auth.uid() OR
    -- Owners see anyone assigned to their lots (via location_id column)
    EXISTS (
      SELECT 1 FROM public.locations l 
      WHERE l.owner_id = auth.uid() 
      AND l.display_id = public.profiles.location_id
    ) OR
    -- Owners see anyone assigned to their lots (via assignments table)
    EXISTS (
      SELECT 1 FROM public.officer_assignments oa
      JOIN public.locations l ON l.display_id = oa.location_id
      WHERE l.owner_id = auth.uid() AND oa.officer_id = public.profiles.id
    ) OR
    -- Managers see people in the same lots
    EXISTS (
      SELECT 1 FROM public.officer_assignments oa1
      JOIN public.officer_assignments oa2 ON oa1.location_id = oa2.location_id
      WHERE oa1.officer_id = auth.uid() AND oa2.officer_id = public.profiles.id
    )
  );

-- 3. Update Officer Assignments RLS
DROP POLICY IF EXISTS "Officer_Assignments_Access_v2" ON public.officer_assignments;
CREATE POLICY "Officer_Assignments_Access_v3" ON public.officer_assignments
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    public.get_my_role() = 'admin' OR
    officer_id = auth.uid() OR
    -- Owners of the lot
    EXISTS (
      SELECT 1 FROM public.locations l 
      WHERE l.display_id = public.officer_assignments.location_id 
      AND l.owner_id = auth.uid()
    )
  );

-- 4. Ensure handle_new_user is robust
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
  raw_pwd TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'officer');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  raw_pwd := NEW.raw_user_meta_data->>'temp_password';
  
  -- If Admin is creating themselves (signup), they might not have a location_id yet
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := floor(random() * 90000 + 10000)::TEXT;
  END IF;

  INSERT INTO public.profiles (id, email, role, location_id, full_name, raw_password)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id, full_name, raw_pwd)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    location_id = COALESCE(profiles.location_id, EXCLUDED.location_id),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    email = EXCLUDED.email,
    raw_password = EXCLUDED.raw_password;
  
  -- Create default location for new Admins
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
