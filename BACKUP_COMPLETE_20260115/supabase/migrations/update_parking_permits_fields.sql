-- Add missing columns to parking_permits table
alter table public.parking_permits 
add column if not exists contact_email text,
add column if not exists location_id text; -- Assuming string ID for now (e.g. 'LOC-001')

-- Note: We enforce mandatory fields in the App Logic (Form Validation) 
-- rather than DB constraints to keep old data valid if any exists.
