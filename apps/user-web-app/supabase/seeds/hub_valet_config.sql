-- Seed: pre-populate addons_config for all 4 hubs
-- Run once in Supabase SQL editor after the 20260418_add_addons_config migration

-- Split Airport
update public.locations
set addons_config = jsonb_build_object(
  'hotspot',   'Terminal 2 · Vrata 3 · Prizemlje',
  'phone_sms', '+385 91 5963139',
  'valet',     jsonb_build_object('enabled', true, 'price_cents', 500, 'lot_zone', 'Parking Sjever · Zona P1'),
  'shuttle',   jsonb_build_object('enabled', true, 'price_cents', 200)
)
where display_id ilike '%split%airport%' or name ilike '%split%airport%';

-- Trogir
update public.locations
set addons_config = jsonb_build_object(
  'hotspot',   'Riva Trogira · Ulaz Centar',
  'phone_sms', '+385 91 5963139',
  'valet',     jsonb_build_object('enabled', true, 'price_cents', 500, 'lot_zone', 'Lot B2 · Centar'),
  'shuttle',   jsonb_build_object('enabled', true, 'price_cents', 200)
)
where display_id ilike '%trogir%' or name ilike '%trogir%';

-- Punta Rata (Brela)
update public.locations
set addons_config = jsonb_build_object(
  'hotspot',   'Church Brela · Soline',
  'phone_sms', '+385 91 5963139',
  'valet',     jsonb_build_object('enabled', true, 'price_cents', 500, 'lot_zone', 'Lot A · Priobalni parking'),
  'shuttle',   jsonb_build_object('enabled', true, 'price_cents', 200)
)
where display_id ilike '%punta%rata%' or name ilike '%punta%rata%' or display_id ilike '%brela%' or name ilike '%brela%';

-- Baška Voda
update public.locations
set addons_config = jsonb_build_object(
  'hotspot',   'Riva Baška Voda · Porta Marina',
  'phone_sms', '+385 91 5963139',
  'valet',     jsonb_build_object('enabled', true, 'price_cents', 500, 'lot_zone', 'Lot C · Zona Jug'),
  'shuttle',   jsonb_build_object('enabled', true, 'price_cents', 200)
)
where display_id ilike '%baska%voda%' or name ilike '%baška%voda%' or name ilike '%baska%voda%';
