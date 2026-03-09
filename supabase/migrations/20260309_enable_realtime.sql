-- Enable Realtime for parking_sessions and parking_permits
-- First, ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Use SET TABLE to ensure these tables are in the publication
-- We use DO block to execute this to be safer
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime SET TABLE public.parking_sessions, public.parking_permits;
EXCEPTION
    WHEN OTHERS THEN
        -- If SET TABLE fails, try ADD TABLE
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_sessions;
        EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_permits;
        EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
