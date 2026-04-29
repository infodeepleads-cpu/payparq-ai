-- Fix: spots.id had no DEFAULT, causing insert failures when id is omitted.
ALTER TABLE public.spots ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.spot_assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
