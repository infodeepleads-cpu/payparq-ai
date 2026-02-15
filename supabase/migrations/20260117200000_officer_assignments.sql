-- Multi-Tenancy Expansion & Officer Scoping Fix

-- 1. Add address column to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Create officer_assignments table for multi-location access
CREATE TABLE IF NOT EXISTS public.officer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL, -- display_id of the location
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(officer_id, location_id)
);

-- Enable RLS for officer_assignments
ALTER TABLE public.officer_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Nuclear RLS Update for officer_assignments
CREATE POLICY "Officer_Assignments_Isolation" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid()
  );

-- 4. Update handle_new_user trigger (No auto-ID for Admins, they must create)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_loc_id TEXT;
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  -- Only auto-assign location_id if it's explicitly passed (like for Officers)
  new_loc_id := NEW.raw_user_meta_data->>'location_id';
  
  -- Update auth metadata
  UPDATE auth.users 
  SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object('role', user_role, 'location_id', new_loc_id)
  WHERE id = NEW.id;

  -- Create profile record
  INSERT INTO public.profiles (id, email, role, location_id)
  VALUES (NEW.id, NEW.email, user_role, new_loc_id)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    location_id = COALESCE(public.profiles.location_id, EXCLUDED.location_id),
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  
  -- NO AUTO-LOCATION CREATION FOR ADMINS HERE. 
  -- They will use the "Add Location" UI.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Locations Isolation to include assigned Officers
DROP POLICY IF EXISTS "Locations_Isolation_v3" ON public.locations;
CREATE POLICY "Locations_Isolation_v4" ON public.locations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.uid() = owner_id OR 
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    display_id IN (SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid())
  );
