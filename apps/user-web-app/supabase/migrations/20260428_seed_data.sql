-- ── Campaigns schema ───────────────────────────────────────────────────────
create table if not exists email_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  html_content text not null,
  recipient_list text default 'all',
  status text default 'draft',
  recipient_count int default 0,
  open_rate int default 0,
  click_rate int default 0,
  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  scheduled_at timestamp,
  sent_at timestamp
);

create table if not exists email_recipients (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  property_type text,
  location text,
  added_at timestamp default now()
);

create table if not exists email_campaign_analytics (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references email_campaigns(id),
  recipient_email text,
  opened_at timestamp,
  clicked_at timestamp,
  created_at timestamp default now()
);

-- ── Split hotel recipients ──────────────────────────────────────────────────
insert into email_recipients (email, name, property_type, location) values
  ('management@hotelluxesplit.com', 'Hotel Luxe Split', 'hotel', 'Split'),
  ('info@ambasadorsplit.com', 'Hotel Ambasador Split', 'hotel', 'Split'),
  ('info@hotelparksplit.com', 'Hotel Park Split', 'hotel', 'Split'),
  ('info@cornarohotel.com', 'Cornaro Hotel Split', 'hotel', 'Split'),
  ('info.split@radissonblu.com', 'Radisson Blu Resort & Spa Split', 'hotel', 'Split'),
  ('info@vestibulpalace.com', 'Hotel Vestibul Palace', 'hotel', 'Split'),
  ('info@hotelslavija.hr', 'Hotel Slavija Split', 'hotel', 'Split'),
  ('booking@hotelperistil.com', 'Hotel Peristil', 'hotel', 'Split'),
  ('info@hotelglobo.com', 'Hotel Globo Split', 'hotel', 'Split'),
  ('info@lhjupiter.com', 'Jupiter Heritage Hotel Split', 'hotel', 'Split')
on conflict (email) do nothing;

-- ── Lot GPS coordinates ─────────────────────────────────────────────────────
-- Split Airport lot (parkng-split-airport)
update public.locations
set lat = 43.5388, lng = 16.2973
where display_id = 'parkng-split-airport'
  and (lat is null or lng is null);

-- Trogir lot (if exists)
update public.locations
set lat = 43.5157, lng = 16.2502
where display_id ilike '%trogir%'
  and (lat is null or lng is null);
