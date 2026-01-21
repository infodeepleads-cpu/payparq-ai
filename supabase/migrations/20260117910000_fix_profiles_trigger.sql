-- FIX PROFILES CONSTRAINTS AND TRIGGER
-- This ensures super_admin is a valid role and the trigger is robust.

-- 1. Update profiles role constraint
-- First drop the old one (it might have different names depending on when it was created)
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

-- 2. Update handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
BEGIN
  -- Extract metadata safely
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  
  -- Logic for new admins without a location
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    -- generate_location_id() should be defined from previous migrations
    new_loc_id := generate_location_id();
  END IF;

  -- Insert or update profile (robust against existing records)
  INSERT INTO public.profiles (id, email, role, location_id, full_name)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id, full_name)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    location_id = COALESCE(EXCLUDED.location_id, profiles.location_id),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = EXCLUDED.email;
  
  -- Create a default location only for new admins who don't have one yet
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
