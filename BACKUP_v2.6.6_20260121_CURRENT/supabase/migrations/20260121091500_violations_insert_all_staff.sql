DROP POLICY IF EXISTS "Violations_Insert" ON public.violations;
CREATE POLICY "Violations_Insert_AllStaff" ON public.violations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

NOTIFY pgrst, 'reload config';
