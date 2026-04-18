alter table public.locations
  add column if not exists addons_config jsonb default '{}'::jsonb;

comment on column public.locations.addons_config is
  'Per-location add-on services config: valet, ev_charging, car_wash, fuel with prices and enabled flags';
