alter table public.locations
  add column if not exists valet_enabled boolean default false,
  add column if not exists shuttle_enabled boolean default false;
