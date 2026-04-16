-- Enable RLS on violations table (mirrors parking_permits pattern from 20260319)
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;

-- Grant table-level access to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.violations TO authenticated;

-- The trigger assign_violation_case_number runs in caller context (not SECURITY DEFINER)
-- so the authenticated role also needs access to violation_case_counters
GRANT SELECT, INSERT, UPDATE ON TABLE public.violation_case_counters TO authenticated;

-- Drop any stale policies before creating (including old hand-written policy with broken join)
DROP POLICY IF EXISTS "staff location access violations" ON public.violations;
DROP POLICY IF EXISTS violations_select_authenticated_location_scope ON public.violations;
DROP POLICY IF EXISTS violations_insert_authenticated_location_scope ON public.violations;
DROP POLICY IF EXISTS violations_update_authenticated_location_scope ON public.violations;
DROP POLICY IF EXISTS violations_delete_authenticated_location_scope ON public.violations;

-- SELECT: see violations only at accessible locations
CREATE POLICY violations_select_authenticated_location_scope
ON public.violations
FOR SELECT
TO authenticated
USING (public.can_access_location(location_id::text));

-- INSERT: create violations only at accessible locations
CREATE POLICY violations_insert_authenticated_location_scope
ON public.violations
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_location(location_id::text));

-- UPDATE: modify violations only at accessible locations
CREATE POLICY violations_update_authenticated_location_scope
ON public.violations
FOR UPDATE
TO authenticated
USING (public.can_access_location(location_id::text))
WITH CHECK (public.can_access_location(location_id::text));

-- DELETE: remove violations only at accessible locations
CREATE POLICY violations_delete_authenticated_location_scope
ON public.violations
FOR DELETE
TO authenticated
USING (public.can_access_location(location_id::text));

-- Add violations to realtime publication so live stream updates work without F5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'violations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.violations;
  END IF;
END $$;
