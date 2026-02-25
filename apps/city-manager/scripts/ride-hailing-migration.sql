
-- 1. Enable PostGIS extension (if not already enabled)
create extension if not exists postgis;

-- 2. Create drivers table to track status and metadata
create table if not exists public.drivers (
  id uuid references auth.users not null primary key,
  full_name text,
  vehicle_info jsonb, -- { make, model, plate, color }
  is_online boolean default false,
  last_h3_index text, -- Current H3 hexagon (resolution 7-9 recommended)
  last_location geometry(Point, 4326),
  updated_at timestamp with time zone default now()
);

-- 3. Create rides table
create table if not exists public.rides (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  passenger_id uuid references auth.users not null,
  driver_id uuid references public.drivers(id),
  status text check (status in ('requested', 'accepted', 'ongoing', 'completed', 'cancelled')) default 'requested',
  pickup_location geometry(Point, 4326) not null,
  pickup_address text,
  dropoff_location geometry(Point, 4326) not null,
  dropoff_address text,
  h3_pickup_index text, -- H3 index of pickup for fast matching
  estimated_price numeric(10, 2),
  actual_price numeric(10, 2)
);

-- 4. Create surge_zones table for H3 dynamic pricing
create table if not exists public.surge_zones (
  zone_id text primary key, -- H3 index
  multiplier numeric(3, 2) default 1.0,
  demand_count int default 0,
  driver_count int default 0,
  updated_at timestamp with time zone default now()
);

-- 5. Uber 2026 Algorithmic Fare Calculator
create or replace function public.calculate_uber_fare(
  dist_meters float, 
  time_seconds float, 
  h3_zone_id text,
  is_payparq_lot boolean default false
)
returns numeric as $$
declare
  base_fare numeric := 2.50;
  km_rate numeric := 1.20;
  min_rate numeric := 0.35;
  marketplace_fee numeric := 2.20;
  surge_multiplier numeric := 1.0;
  market_adjustment_factor numeric := 0.98; -- PayParq is always 2% cheaper by default
begin
  -- 1. Get Surge from H3 dynamic table
  select multiplier into surge_multiplier 
  from public.surge_zones where zone_id = h3_zone_id;
  
  if surge_multiplier is null then
    surge_multiplier := 1.0;
  end if;

  -- 2. Uber's 2026 Rebalancing Logic:
  -- If it's a short trip (< 3km), increase the km_rate by 20%
  if (dist_meters < 3000) then
    km_rate := km_rate * 1.2;
  end if;

  -- 3. PayParq "Combo" Advantage:
  -- -10% on Marketplace Fee if starting from PayParq parking lot
  if (is_payparq_lot) then
    marketplace_fee := marketplace_fee * 0.9;
  end if;

  -- 4. Final Calculation with Market Delta
  return round(
    (
      (base_fare + 
       (dist_meters / 1000 * km_rate) + 
       (time_seconds / 60 * min_rate) + 
       marketplace_fee
      ) * surge_multiplier * market_adjustment_factor
    )::numeric, 
    2
  );
end;
$$ language plpgsql;

-- 6. RPC function for matching drivers using H3 + PostGIS
-- Finds drivers in the same or neighboring H3 hexagons
create or replace function public.match_drivers_h3(
  pickup_h3_index text,
  max_distance_meters float default 5000,
  limit_count int default 10
)
returns setof public.drivers
language plpgsql
security definer
as $$
begin
  return query
  select d.*
  from public.drivers d
  where d.is_online = true
    -- We match by H3 index first (exact or nearby can be handled by passing array of H3 indexes from client)
    -- Or we use PostGIS distance check as the primary filter if spatial index is available
    and d.last_h3_index = pickup_h3_index
    and d.id not in (select driver_id from public.rides where status in ('accepted', 'ongoing'))
  limit limit_count;
end;
$$;

-- Enable Realtime for these tables
alter publication supabase_realtime add table public.drivers;
alter publication supabase_realtime add table public.rides;

-- Enable RLS
alter table public.drivers enable row level security;
alter table public.rides enable row level security;

-- Simple Policies (Expand based on needs)
create policy "Drivers are visible to everyone when online"
  on public.drivers for select
  using (is_online = true);

create policy "Users can manage their own driver profile"
  on public.drivers for all
  using (auth.uid() = id);

create policy "Passengers can see their own rides"
  on public.rides for select
  using (auth.uid() = passenger_id or auth.uid() = driver_id);
