DROP POLICY IF EXISTS "Violations_Insert" ON public.violations;

CREATE POLICY "Violations_Insert" ON public.violations
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    EXISTS (
      SELECT 1
      FROM public.locations 
      WHERE (locations.display_id = public.violations.location_id::TEXT 
             OR locations.id::TEXT = public.violations.location_id::TEXT)
        AND (locations.owner_id = auth.uid() 
             OR locations.display_id = (auth.jwt() -> 'user_metadata' ->> 'location_id'))
    ) OR
    public.violations.location_id::TEXT IN (
      SELECT location_id 
      FROM public.officer_assignments 
      WHERE officer_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.violations;

NOTIFY pgrst, 'reload config';

