-- Master Auth and Isolation Migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_id TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Function to generate a random 5-digit number
CREATE OR REPLACE FUNCTION generate_location_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  LOOP
    new_id := floor(random() * (99999 - 10000 + 1) + 10000)::TEXT;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE location_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create a profile and location on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  
  IF user_role = 'admin' AND new_loc_id IS NULL THEN
    new_loc_id := generate_location_id();
  END IF;

  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id);
  
  IF user_role = 'admin' AND NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_loc_id) THEN
    INSERT INTO public.locations (name, display_id, owner_id)
    VALUES ('My Parking Lot', new_loc_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Isolation Policies
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Locations_Isolation" ON public.locations;
CREATE POLICY "Locations_Isolation" ON public.locations
  FOR ALL USING (
    (auth.uid() = owner_id) OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND location_id = public.locations.display_id))
  );

ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions_Isolation" ON public.parking_sessions;
CREATE POLICY "Sessions_Isolation" ON public.parking_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.locations l ON l.display_id = p.location_id
      WHERE p.id = auth.uid() AND l.id = public.parking_sessions.location_id
    )
  );

ALTER TABLE public.parking_permits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permits_Isolation" ON public.parking_permits;
CREATE POLICY "Permits_Isolation" ON public.parking_permits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.locations l ON l.display_id = p.location_id
      WHERE p.id = auth.uid() AND l.id = public.parking_permits.location_id
    )
  );
