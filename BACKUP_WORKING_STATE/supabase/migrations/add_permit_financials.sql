-- Add financial fields to parking_permits
alter table public.parking_permits 
add column if not exists price numeric default 0.00,
add column if not exists stripe_payment_id text,
add column if not exists stripe_payment_url text,
add column if not exists duration_hours int; -- explicit duration if needed, though can be calculated from start/end
