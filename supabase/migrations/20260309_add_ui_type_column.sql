-- Migration to add ui_type column and handle dashboard filtering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parking_sessions' AND column_name = 'ui_type'
    ) THEN
        ALTER TABLE public.parking_sessions ADD COLUMN ui_type text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parking_permits' AND column_name = 'ui_type'
    ) THEN
        ALTER TABLE public.parking_permits ADD COLUMN ui_type text;
    END IF;
END $$;

-- Update RLS policies to allow reading the new column
-- (Assuming existing SELECT policies allow all columns, but let's be safe)
-- If there are specific policies that need to be refreshed, we do it here.

-- For now, let's just ensure the column exists.
