-- v2.4.3: RESTORE ADMIN STAFF VISIBILITY (NON-RECURSIVE)
-- This migration updates the Profiles RLS policy to allow Admins and Managers
-- to see their staff members without causing database deadlocks.

-- 1. Update Profiles RLS
DROP POLICY IF EXISTS "Profiles_Garanteed_Access" ON public.profiles;
CREATE POLICY "Profiles_Garanteed_Access_v2" ON public.profiles
  FOR ALL USING (
    -- Rule 1: Self access
    id = auth.uid() OR 
    
    -- Rule 2: Super Admin access (JWT-based)
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    
    -- Rule 3: Admin access (JWT-based)
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND
      (
        -- Target is at a location I own
        location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid()) OR
        -- OR Target is assigned to a location I own
        EXISTS (
          SELECT 1 FROM public.officer_assignments oa
          JOIN public.locations l ON l.display_id = oa.location_id
          WHERE l.owner_id = auth.uid() AND oa.officer_id = public.profiles.id
        )
      )
    ) OR
    
    -- Rule 4: Manager access (JWT-based)
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' AND
      EXISTS (
        SELECT 1 FROM public.officer_assignments oa_me
        JOIN public.officer_assignments oa_them ON oa_me.location_id = oa_them.location_id
        WHERE oa_me.officer_id = auth.uid() AND oa_them.officer_id = public.profiles.id
      )
    )
  );

-- 2. Update Officer Assignments RLS to be more robust for Admins
DROP POLICY IF EXISTS "Officer_Assignments_Garanteed_Access" ON public.officer_assignments;
CREATE POLICY "Officer_Assignments_Garanteed_Access_v2" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    officer_id = auth.uid() OR
    -- Admins see assignments for lots they own
    location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid()) OR
    -- Managers see assignments for lots they are in
    location_id IN (
      SELECT location_id FROM public.officer_assignments 
      WHERE officer_id = auth.uid()
    )
  );
