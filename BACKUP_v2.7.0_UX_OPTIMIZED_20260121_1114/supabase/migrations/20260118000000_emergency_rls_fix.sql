-- v2.4.1: EMERGENCY FIX FOR RLS RECURSION (BUFFERING ISSUE)
-- This migration removes recursive lookups that were causing database deadlocks.

-- 1. Drop recursive policies
DROP POLICY IF EXISTS "Profiles_Staff_Access_v5" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Staff_Access_v4" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Staff_Access_v3" ON public.profiles;
DROP POLICY IF EXISTS "Officer_Assignments_Access_v3" ON public.officer_assignments;
DROP POLICY IF EXISTS "Officer_Assignments_Access_v2" ON public.officer_assignments;

-- 2. Create SAFE policies for Profiles (using JWT metadata to avoid recursion)
CREATE POLICY "Profiles_Staff_Access_v6" ON public.profiles
  FOR ALL USING (
    -- Super Admins (from JWT) see everyone
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    -- Users see themselves
    id = auth.uid() OR
    -- Admins (from JWT) see anyone in a lot they manage
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND
      (
        -- Check if they are assigned to the lot
        location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid()) OR
        -- Or check if there's an assignment
        id IN (
          SELECT officer_id FROM public.officer_assignments 
          WHERE location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid())
        )
      )
    ) OR
    -- Managers (from JWT) see people assigned to the same lots
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' AND
      id IN (
        SELECT oa_target.officer_id 
        FROM public.officer_assignments oa_me
        JOIN public.officer_assignments oa_target ON oa_me.location_id = oa_target.location_id
        WHERE oa_me.officer_id = auth.uid()
      )
    )
  );

-- 3. Create SAFE policies for Officer Assignments
CREATE POLICY "Officer_Assignments_Access_v4" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    officer_id = auth.uid() OR
    -- Owners of the lot
    location_id IN (SELECT display_id FROM public.locations WHERE owner_id = auth.uid()) OR
    -- Managers assigned to the lot
    location_id IN (
      SELECT location_id FROM public.officer_assignments 
      WHERE officer_id = auth.uid()
    )
  );
