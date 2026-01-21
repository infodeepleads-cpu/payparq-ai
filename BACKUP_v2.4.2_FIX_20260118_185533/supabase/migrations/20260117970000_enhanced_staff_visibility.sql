-- v2.2.0: ENHANCED STAFF VISIBILITY FOR ADMINS
-- This ensures Owners and Managers can see staff assigned to their lots immediately.

-- 1. Update Profiles RLS
DROP POLICY IF EXISTS "Profiles_Staff_Access_v2" ON public.profiles;
CREATE POLICY "Profiles_Staff_Access_v3" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    id = auth.uid() OR
    -- Owners: See any profile assigned to any lot they own
    EXISTS (
      SELECT 1 FROM public.officer_assignments oa
      JOIN public.locations l ON l.display_id = oa.location_id
      WHERE l.owner_id = auth.uid() AND oa.officer_id = public.profiles.id
    ) OR
    -- Managers: See any profile assigned to any lot they are also assigned to
    EXISTS (
      SELECT 1 FROM public.officer_assignments oa1
      JOIN public.officer_assignments oa2 ON oa1.location_id = oa2.location_id
      WHERE oa1.officer_id = auth.uid() AND oa2.officer_id = public.profiles.id
    ) OR
    -- Fallback: See people with the same location_id metadata
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id')
  );

-- 2. Ensure officer_assignments is also fully accessible to owners of the lots
DROP POLICY IF EXISTS "Officer_Assignments_Access" ON public.officer_assignments;
CREATE POLICY "Officer_Assignments_Access_v2" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid() OR
    -- Owners of the lot
    EXISTS (
      SELECT 1 FROM public.locations l 
      WHERE l.display_id = public.officer_assignments.location_id 
      AND l.owner_id = auth.uid()
    ) OR
    -- Managers assigned to the lot
    location_id IN (
      SELECT oa.location_id FROM public.officer_assignments oa 
      WHERE oa.officer_id = auth.uid()
    )
  );
