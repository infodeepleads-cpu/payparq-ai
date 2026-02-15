-- v2.1.0: FIX STAFF VISIBILITY AND EMAIL PASSWORD METADATA
-- This ensures Admins/Managers can see staff members assigned to their lots immediately.

-- 1. Update Profiles RLS to be more robust for Admins/Managers
DROP POLICY IF EXISTS "Profiles_Staff_Access" ON public.profiles;
CREATE POLICY "Profiles_Staff_Access_v2" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    id = auth.uid() OR
    -- Can see people in the same location as my JWT
    location_id = (auth.jwt() -> 'user_metadata' ->> 'location_id') OR
    -- Owners can see everyone assigned to ANY lot they own
    EXISTS (
      SELECT 1 FROM public.locations 
      WHERE locations.owner_id = auth.uid() 
      AND locations.display_id = public.profiles.location_id
    ) OR
    -- Managers can see everyone assigned to ANY lot they are also assigned to
    public.profiles.location_id IN (
      SELECT oa.location_id FROM public.officer_assignments oa 
      WHERE oa.officer_id = auth.uid()
    )
  );

-- 2. Ensure the trigger handle_new_user is robust for invitations
-- No changes needed to trigger, but ensuring it exists and is active
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
