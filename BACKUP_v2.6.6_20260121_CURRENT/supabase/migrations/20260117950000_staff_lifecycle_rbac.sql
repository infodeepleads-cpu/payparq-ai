-- v2.0.0: STAFF LIFECYCLE AND RBAC ENFORCEMENT
-- 1. Update Profiles RLS to ensure Owners/Managers can see their staff
DROP POLICY IF EXISTS "Profiles_JWT_Access" ON public.profiles;
CREATE POLICY "Profiles_Staff_Access" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    id = auth.uid() OR
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    -- Owners can see everyone assigned to their lots
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE locations.owner_id = auth.uid() 
      AND locations.display_id = public.profiles.location_id
    ) OR
    -- Managers/Officers can see others assigned to the same lots
    public.profiles.location_id IN (
      SELECT location_id FROM public.officer_assignments WHERE officer_id = auth.uid()
    )
  );

-- 2. Ensure Managers can also manage officer assignments for their lots
DROP POLICY IF EXISTS "Officer_Assignments_JWT_Access" ON public.officer_assignments;
CREATE POLICY "Officer_Assignments_Access" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid() OR
    -- Managers can manage assignments for lots they are assigned to
    location_id IN (
      SELECT oa.location_id FROM public.officer_assignments oa 
      WHERE oa.officer_id = auth.uid()
    )
  );
