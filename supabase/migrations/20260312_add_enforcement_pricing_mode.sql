DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'locations'
          AND column_name = 'enforcement_pricing_mode'
    ) THEN
        ALTER TABLE public.locations
        ADD COLUMN enforcement_pricing_mode text NOT NULL DEFAULT 'hourly';
    END IF;
END $$;
