-- Driver rating count for running average
alter table public.drivers add column if not exists ratings_count int not null default 0;
