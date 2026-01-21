-- Identity Repair and Multi-Tenancy Schema Upgrade

-- 1. Add location_id to violations table for direct scoping
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violations' AND column_name = 'location_id') THEN
        ALTER TABLE public.violations ADD COLUMN location_id TEXT;
    END IF;
END $$;

-- 2. REPAIR ACCOUNT: payparq@outlook.com
DO $$
DECLARE
  v_user_id UUID;
  v_new_loc_id TEXT := '55555'; -- Custom assigned ID for payparq outlook
BEGIN
  -- Find the user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'payparq@outlook.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Update profile with the new location_id
    UPDATE public.profiles 
    SET location_id = v_new_loc_id, role = 'admin'
    WHERE id = v_user_id;

    -- Ensure an initial location exists for this user and ID
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = v_new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id, capacity)
      VALUES ('Main Outlook Lot', v_new_loc_id, v_user_id, 50);
    END IF;
  END IF;
END $$;

-- 3. Ensure handle_new_user is robust for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := public.generate_unique_display_id();
  END IF;

  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    location_id = COALESCE(public.profiles.location_id, EXCLUDED.location_id);
  
  IF user_role = 'admin' AND new_loc_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
      INSERT INTO public.locations (name, display_id, owner_id)
      VALUES ('My First Lot', new_loc_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
