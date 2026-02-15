-- FIX RECURSION AND HELPER FUNCTIONS

-- 1. Create helper functions with SECURITY DEFINER to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_location_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT location_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Profiles Isolation (Bulletproof)
DROP POLICY IF EXISTS "Profiles_Isolation" ON public.profiles;
CREATE POLICY "Profiles_Isolation" ON public.profiles
  FOR ALL USING (
    public.get_auth_role() = 'super_admin' OR
    id = auth.uid() OR
    location_id = public.get_auth_location_id()
  );

-- 3. Update Locations Isolation
DROP POLICY IF EXISTS "Locations_Isolation" ON public.locations;
CREATE POLICY "Locations_Isolation" ON public.locations
  FOR ALL USING (
    public.get_auth_role() = 'super_admin' OR
    auth.uid() = owner_id OR 
    display_id = public.get_auth_location_id()
  );

-- 4. Update Sessions Isolation
DROP POLICY IF EXISTS "Sessions_Isolation" ON public.parking_sessions;
CREATE POLICY "Sessions_Isolation" ON public.parking_sessions
  FOR ALL USING (
    public.get_auth_role() = 'super_admin' OR
    location_id = public.get_auth_location_id() OR
    EXISTS (SELECT 1 FROM public.locations l WHERE l.display_id = public.parking_sessions.location_id AND l.owner_id = auth.uid())
  );

-- 5. Update Violations Isolation
DROP POLICY IF EXISTS "Violations_Isolation" ON public.violations;
CREATE POLICY "Violations_Isolation" ON public.violations
  FOR ALL USING (
    public.get_auth_role() = 'super_admin' OR
    location_id = public.get_auth_location_id()
  );
