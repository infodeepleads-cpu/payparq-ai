-- Migration to allow updates on locations table
-- This is required for the Dynamic Pricing Engine to save settings
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public update on locations" ON public.locations;

CREATE POLICY "Allow public update on locations" 
ON public.locations FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);
