-- LOCATION AUTO-ID TRIGGER AND SCHEMA STABILITY

-- 1. Ensure the generate_unique_display_id function is robust and uses the public schema
CREATE OR REPLACE FUNCTION public.generate_unique_display_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  LOOP
    -- Generate random 5-digit number
    new_id := floor(random() * (99999 - 10000 + 1) + 10000)::TEXT;
    -- Check if it's already used
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.locations WHERE display_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create trigger function to auto-assign display_id on insert
CREATE OR REPLACE FUNCTION public.trig_assign_location_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := public.generate_unique_display_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Apply the trigger to locations table
DROP TRIGGER IF EXISTS tr_assign_location_display_id ON public.locations;
CREATE TRIGGER tr_assign_location_display_id
BEFORE INSERT ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.trig_assign_location_display_id();

-- 4. Ensure address column exists and display_id is unique/not null
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'address') THEN
        ALTER TABLE public.locations ADD COLUMN address TEXT;
    END IF;
    
    -- Ensure display_id has a unique constraint if it doesn't already
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_display_id_key') THEN
        ALTER TABLE public.locations ADD CONSTRAINT locations_display_id_key UNIQUE (display_id);
    END IF;
END $$;
