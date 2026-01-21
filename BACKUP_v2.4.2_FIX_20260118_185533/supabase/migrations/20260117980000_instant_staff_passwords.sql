-- v2.3.0: INSTANT STAFF ONBOARDING AND VIEWABLE PASSWORDS
-- 1. Add raw_password to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS raw_password TEXT;

-- 2. Update handle_new_user trigger to capture raw_password
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
  full_name TEXT;
  raw_pwd TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  full_name := NEW.raw_user_meta_data->>'name';
  raw_pwd := NEW.raw_user_meta_data->>'temp_password';
  
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    -- Fallback if generate_location_id doesn't exist, use random 5-digit
    BEGIN
      new_loc_id := generate_location_id();
    EXCEPTION WHEN OTHERS THEN
      new_loc_id := floor(random() * 90000 + 10000)::TEXT;
    END;
  END IF;

  INSERT INTO public.profiles (id, email, role, location_id, full_name, raw_password)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id, full_name, raw_pwd)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    location_id = COALESCE(profiles.location_id, EXCLUDED.location_id),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    email = EXCLUDED.email,
    raw_password = COALESCE(profiles.raw_password, EXCLUDED.raw_password);
  
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My Parking Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
