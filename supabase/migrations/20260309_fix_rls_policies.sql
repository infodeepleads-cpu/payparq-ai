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

CREATE POLICY officer_assignments_select_admin_manager_visibility
ON public.officer_assignments
FOR SELECT
TO authenticated
USING (
  officer_id::text = auth.uid()::text
  OR assigned_by::text = auth.uid()::text
  OR replace(replace(lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', '')), '-', '_'), ' ', '_') IN ('superadmin', 'super_admin')
);

CREATE POLICY profiles_select_admin_manager_visibility
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR replace(replace(lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', '')), '-', '_'), ' ', '_') IN ('superadmin', 'super_admin')
  OR EXISTS (
    SELECT 1
    FROM public.officer_assignments oa
    WHERE oa.officer_id::text = public.profiles.id::text
      AND oa.assigned_by::text = auth.uid()::text
  )
);

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
