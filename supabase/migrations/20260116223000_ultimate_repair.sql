-- ULTIMATE DATABASE REPAIR SCRIPT
-- Run this in your Supabase SQL Editor

-- 1. Ensure required functions exist
CREATE OR REPLACE FUNCTION public.generate_unique_display_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  LOOP
    new_id := floor(random() * (99999 - 10000 + 1) + 10000)::TEXT;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. "Bulletproof" handle_new_user trigger
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
    BEGIN
      new_loc_id := public.generate_unique_display_id();
    EXCEPTION WHEN OTHERS THEN
      new_loc_id := (floor(random() * 90000) + 10000)::TEXT; -- Fallback random ID
    END;
  END IF;

  -- Create profile with ON CONFLICT ignore to prevent signup failure if record exists
  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    location_id = COALESCE(public.profiles.location_id, EXCLUDED.location_id);
  
  -- Create initial location only for new admins
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      BEGIN
        INSERT INTO public.locations (name, display_id, owner_id)
        VALUES ('My First Lot', new_loc_id, NEW.id);
      EXCEPTION WHEN OTHERS THEN
        -- Log error or handle silently to not block signup
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-APPLY RLS POLICIES (Simplified)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles_Isolation" ON public.profiles;
CREATE POLICY "Profiles_Isolation" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR
    id = auth.uid() OR
    location_id = (SELECT p.location_id FROM public.profiles p WHERE p.id = auth.uid())
  );

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Locations_Isolation" ON public.locations;
CREATE POLICY "Locations_Isolation" ON public.locations
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'officer' AND p.location_id = public.locations.display_id)
  );

-- 4. REPAIR SUPER ADMIN ACCOUNT
-- This ensures kzamic@gmail.com has a profile even if the trigger failed
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kzamic@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, location_id)
    VALUES (v_user_id, 'kzamic@gmail.com', 'super_admin', '00000')
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
  END IF;
END $$;
