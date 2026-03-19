ALTER TABLE public.parking_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_location(row_location_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_norm text;
  profile_role_norm text;
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
          auth.jwt() ->> 'role',
          ''
        )
      ),
      '-',
      '_'
    ),
    ' ',
    '_'
  );

  IF role_norm = '' OR role_norm NOT IN ('superadmin', 'super_admin', 'admin', 'manager', 'officer') THEN
    SELECT replace(
             replace(lower(coalesce(p.role, '')), '-', '_'),
             ' ',
             '_'
           )
      INTO profile_role_norm
    FROM public.profiles p
    WHERE p.id::text = auth.uid()::text
    LIMIT 1;

    role_norm := coalesce(profile_role_norm, '');
  END IF;

  IF role_norm IN ('superadmin', 'super_admin') THEN
    RETURN true;
  END IF;

  IF row_location_id IS NULL OR btrim(row_location_id) = '' THEN
    RETURN false;
  END IF;

  IF role_norm = 'admin' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.locations l
      WHERE l.owner_id::text = auth.uid()::text
        AND (
          l.id::text = row_location_id
          OR l.display_id::text = row_location_id
        )
    );
  END IF;

  IF role_norm IN ('manager', 'officer') THEN
    IF EXISTS (
      SELECT 1
      FROM public.officer_assignments oa
      LEFT JOIN public.locations l
        ON l.id::text = oa.location_id::text
        OR l.display_id::text = oa.location_id::text
      WHERE oa.officer_id::text = auth.uid()::text
        AND (
          oa.location_id::text = row_location_id
          OR l.id::text = row_location_id
          OR l.display_id::text = row_location_id
        )
    ) THEN
      RETURN true;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      LEFT JOIN public.locations l
        ON l.id::text = p.location_id::text
        OR l.display_id::text = p.location_id::text
      WHERE p.id::text = auth.uid()::text
        AND (
          p.location_id::text = row_location_id
          OR l.id::text = row_location_id
          OR l.display_id::text = row_location_id
        )
    ) THEN
      RETURN true;
    END IF;

    RETURN EXISTS (
      SELECT 1
      FROM public.locations l
      WHERE l.owner_id::text = auth.uid()::text
        AND (
          l.id::text = row_location_id
          OR l.display_id::text = row_location_id
        )
    );
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS parking_permits_select_authenticated_location_scope ON public.parking_permits;
DROP POLICY IF EXISTS parking_permits_insert_authenticated_location_scope ON public.parking_permits;
DROP POLICY IF EXISTS parking_permits_update_authenticated_location_scope ON public.parking_permits;
DROP POLICY IF EXISTS parking_permits_delete_authenticated_location_scope ON public.parking_permits;
DROP POLICY IF EXISTS parking_sessions_select_authenticated_location_scope ON public.parking_sessions;

CREATE POLICY parking_permits_select_authenticated_location_scope
ON public.parking_permits
FOR SELECT
TO authenticated
USING (public.can_access_location(location_id::text));

CREATE POLICY parking_permits_insert_authenticated_location_scope
ON public.parking_permits
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_location(location_id::text));

CREATE POLICY parking_permits_update_authenticated_location_scope
ON public.parking_permits
FOR UPDATE
TO authenticated
USING (public.can_access_location(location_id::text))
WITH CHECK (public.can_access_location(location_id::text));

CREATE POLICY parking_permits_delete_authenticated_location_scope
ON public.parking_permits
FOR DELETE
TO authenticated
USING (public.can_access_location(location_id::text));

CREATE POLICY parking_sessions_select_authenticated_location_scope
ON public.parking_sessions
FOR SELECT
TO authenticated
USING (public.can_access_location(location_id::text));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parking_permits TO authenticated;
GRANT SELECT ON TABLE public.parking_sessions TO authenticated;
