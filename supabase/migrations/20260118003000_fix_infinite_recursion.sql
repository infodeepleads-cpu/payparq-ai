-- v2.4.4: FINAL FIX FOR RLS RECURSION (ERROR 42P17)
-- This migration uses SECURITY DEFINER functions to break the recursion loop
-- between profiles, locations, and officer_assignments.

-- 1. Helper Function: Check if a user owns a location (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_location_owner(target_uid UUID, target_loc_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.locations 
    WHERE owner_id = target_uid AND display_id = target_loc_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Check if a user is assigned to a location
CREATE OR REPLACE FUNCTION public.is_assigned_to_location(target_uid UUID, target_loc_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.officer_assignments 
    WHERE officer_id = target_uid AND location_id = target_loc_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper Function: Check if an admin owns ANY lot assigned to a specific officer
CREATE OR REPLACE FUNCTION public.is_admin_of_officer(admin_uid UUID, officer_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.officer_assignments oa
    JOIN public.locations l ON l.display_id = oa.location_id
    WHERE l.owner_id = admin_uid AND oa.officer_id = officer_uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper Function: Check if two users share any lot (Manager view)
CREATE OR REPLACE FUNCTION public.share_any_location(uid1 UUID, uid2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.officer_assignments oa1
    JOIN public.officer_assignments oa2 ON oa1.location_id = oa2.location_id
    WHERE oa1.officer_id = uid1 AND oa2.officer_id = uid2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-APPLY POLICIES USING HELPERS (No Recursion)

-- Profiles
DROP POLICY IF EXISTS "Profiles_Garanteed_Access_v2" ON public.profiles;
CREATE POLICY "Profiles_Final_Access" ON public.profiles
  FOR ALL USING (
    id = auth.uid() OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND
      (
        public.is_location_owner(auth.uid(), location_id) OR
        public.is_admin_of_officer(auth.uid(), id)
      )
    ) OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' AND
      public.share_any_location(auth.uid(), id)
    )
  );

-- Officer Assignments
DROP POLICY IF EXISTS "Officer_Assignments_Garanteed_Access_v2" ON public.officer_assignments;
CREATE POLICY "Officer_Assignments_Final_Access" ON public.officer_assignments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    officer_id = auth.uid() OR
    public.is_location_owner(auth.uid(), location_id) OR
    public.is_assigned_to_location(auth.uid(), location_id)
  );

-- Locations (Ensuring no recursion)
DROP POLICY IF EXISTS "Locations_Garanteed_Access" ON public.locations;
CREATE POLICY "Locations_Final_Access" ON public.locations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    owner_id = auth.uid() OR
    display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    public.is_assigned_to_location(auth.uid(), display_id)
  );
