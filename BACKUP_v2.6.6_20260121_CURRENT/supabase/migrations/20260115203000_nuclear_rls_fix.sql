-- Nuclear RLS fix for locations
-- This ensures anyone can update anything without restriction for debugging
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public update on locations" ON public.locations;
DROP POLICY IF EXISTS "Allow public select on locations" ON public.locations;
DROP POLICY IF EXISTS "Enable update for all" ON public.locations;

CREATE POLICY "Locations_Public_Select" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Locations_Public_Update" ON public.locations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Locations_Public_Insert" ON public.locations FOR INSERT WITH CHECK (true);

-- Ensure the anon and authenticated roles have full permissions on the table
GRANT ALL ON public.locations TO anon;
GRANT ALL ON public.locations TO authenticated;
GRANT ALL ON public.locations TO postgres;
GRANT ALL ON public.locations TO service_role;
