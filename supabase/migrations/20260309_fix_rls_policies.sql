-- Enable RLS for parking_sessions and parking_permits
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_permits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.parking_sessions;
DROP POLICY IF EXISTS "Allow public read access" ON public.parking_permits;

-- Create policy to allow anon (public) read access to parking_sessions
CREATE POLICY "Allow public read access" 
ON public.parking_sessions 
FOR SELECT 
TO anon 
USING (true);

-- Create policy to allow anon (public) read access to parking_permits
CREATE POLICY "Allow public read access" 
ON public.parking_permits 
FOR SELECT 
TO anon 
USING (true);

-- Ensure realtime publication exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_assignments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'officer_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.officer_assignments', p.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS profiles_select_staff_visibility ON public.profiles;
DROP POLICY IF EXISTS profiles_select_staff_visibility_v2 ON public.profiles;
DROP POLICY IF EXISTS profiles_select_v3 ON public.profiles;
DROP POLICY IF EXISTS profiles_select_v4 ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin_manager_visibility ON public.profiles;
DROP POLICY IF EXISTS officer_assignments_select_staff_visibility ON public.officer_assignments;
DROP POLICY IF EXISTS officer_assignments_select_admin_manager_visibility ON public.officer_assignments;

DROP TRIGGER IF EXISTS sync_officer_assignment_hierarchy_trigger ON public.officer_assignments;
DROP FUNCTION IF EXISTS public.sync_officer_assignment_hierarchy();
DROP FUNCTION IF EXISTS public.can_view_officer_assignment(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.can_view_officer_assignment(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.can_view_profile(uuid);

CREATE OR REPLACE FUNCTION public.can_view_officer_assignment(
  row_officer_id uuid,
  row_location_id text,
  row_assigned_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_norm text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  role_norm := replace(
    replace(
      lower(
        coalesce(
          auth.jwt() -> 'user_metadata' ->> 'role',
          auth.jwt() -> 'app_metadata' ->> 'role',
          ''
        )
      ),
      '-',
      '_'
    ),
    ' ',
    '_'
  );

  IF row_officer_id::text = auth.uid()::text OR row_assigned_by::text = auth.uid()::text THEN
    RETURN true;
  END IF;

  IF role_norm IN ('superadmin', 'super_admin') THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.officer_assignments parent
    WHERE parent.officer_id::text = row_assigned_by::text
      AND parent.assigned_by::text = auth.uid()::text
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.officer_assignments my_assignment
    WHERE my_assignment.officer_id::text = auth.uid()::text
      AND my_assignment.location_id::text = row_location_id::text
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_norm text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  role_norm := replace(
    replace(
      lower(
        coalesce(
          auth.jwt() -> 'user_metadata' ->> 'role',
          auth.jwt() -> 'app_metadata' ->> 'role',
          ''
        )
      ),
      '-',
      '_'
    ),
    ' ',
    '_'
  );

  IF target_profile_id::text = auth.uid()::text THEN
    RETURN true;
  END IF;

  IF role_norm IN ('superadmin', 'super_admin') THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.officer_assignments oa
    WHERE oa.officer_id::text = target_profile_id::text
      AND public.can_view_officer_assignment(oa.officer_id, oa.location_id, oa.assigned_by)
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE POLICY officer_assignments_select_admin_manager_visibility
ON public.officer_assignments
FOR SELECT
TO authenticated
USING (public.can_view_officer_assignment(officer_id, location_id, assigned_by));

CREATE POLICY profiles_select_admin_manager_visibility
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));

-- Safely add tables to the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'parking_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_sessions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'parking_permits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_permits;
  END IF;
END $$;
