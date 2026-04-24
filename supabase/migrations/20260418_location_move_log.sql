create table if not exists public.location_move_log (
  id             uuid primary key default gen_random_uuid(),
  location_id    uuid not null references public.locations(id) on delete cascade,
  moved_by       uuid references auth.users(id) on delete set null,
  old_lat        float8 not null,
  old_lng        float8 not null,
  new_lat        float8 not null,
  new_lng        float8 not null,
  reason         text,
  affected_sessions jsonb default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

alter table public.location_move_log enable row level security;

-- Only service role can read/write audit log
create policy "service_only" on public.location_move_log
  using (false) with check (false);
