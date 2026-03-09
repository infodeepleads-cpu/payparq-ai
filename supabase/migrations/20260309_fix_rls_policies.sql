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
