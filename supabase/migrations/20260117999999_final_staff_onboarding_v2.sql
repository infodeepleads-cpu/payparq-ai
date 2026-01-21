-- v2.4.0: FINAL STAFF VISIBILITY AND PASSWORD STORAGE FIX
-- 1. Ensure raw_password exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS raw_password TEXT;

-- 2. Update Profiles RLS to be bulletproof for Admins
DROP POLICY IF EXISTS "Profiles_Staff_Access_v4" ON public.profiles;
CREATE POLICY "Profiles_Staff_Access_v5" ON public.profiles
  FOR ALL USING (
    -- Super Admins see everyone
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR
    -- Users see themselves
    id = auth.uid() OR
    -- Admins see anyone assigned to a lot they own (via profile.location_id)
    location_id IN (
      SELECT display_id FROM public.locations WHERE owner_id = auth.uid()
    ) OR
    -- Admins see anyone assigned to a lot they own (via officer_assignments)
    id IN (
      SELECT officer_id FROM public.officer_assignments 
      WHERE location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid())
    ) OR
    -- Managers see people assigned to the same lots
    id IN (
      SELECT oa_target.officer_id 
      FROM public.officer_assignments oa_me
      JOIN public.officer_assignments oa_target ON oa_me.location_id = oa_target.location_id
      WHERE oa_me.officer_id = auth.uid()
    )
  );

-- 3. Fix handle_new_user trigger to reliably capture password
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
  raw_pwd TEXT;
BEGIN
  -- Extract from raw_user_meta_data (where createUser/inviteUser metadata lives)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'officer');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  raw_pwd := NEW.raw_user_meta_data->>'temp_password';
  
  -- Debug capture for raw_pwd (it must be passed in user_metadata)
  IF raw_pwd IS NULL THEN
     -- Check if it's in a different nested field or if we can use a fallback
     raw_pwd := NEW.raw_user_meta_data->'data'->>'temp_password';
  END IF;

  -- Create default location for new Admins if needed
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
    raw_password = COALESCE(EXCLUDED.raw_password, profiles.raw_password);
  
  -- Create location entry for Admins
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
