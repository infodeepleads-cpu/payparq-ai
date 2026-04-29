-- ── Spots: digitally tracked parking spots per lot ─────────────────────────
create table if not exists public.spots (
  id uuid default gen_random_uuid() primary key,
  location_id text not null,
  label text not null,
  row_num int,
  col_num int,
  lat double precision,
  lng double precision,
  price_modifier_cents int default 0,
  active boolean default true,
  created_at timestamp default now()
);

create index if not exists spots_location_id_idx on public.spots(location_id);

-- ── Spot assignments: links spots to parking sessions ───────────────────────
create table if not exists public.spot_assignments (
  id uuid default gen_random_uuid() primary key,
  spot_id uuid references public.spots(id),
  parking_session_id text not null,
  assigned_at timestamp default now(),
  status text default 'active'
);

create unique index if not exists spot_assignments_session_idx on public.spot_assignments(parking_session_id);
create index if not exists spot_assignments_spot_id_idx on public.spot_assignments(spot_id);
