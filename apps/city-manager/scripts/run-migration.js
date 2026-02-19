import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

// SQL to create emails table
const migrationSQL = `
-- Create emails table to store incoming messages
create table public.emails (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  from_address text not null,
  to_address text not null,
  subject text,
  html_body text,
  text_body text,
  raw_json jsonb,
  read boolean default false,
  constraint emails_pkey primary key (id)
);

-- Enable RLS
alter table public.emails enable row level security;

-- Create policy to allow authenticated users to read emails
create policy "Allow authenticated users to read emails"
on public.emails
for select
to authenticated
using (true);

-- Create policy to allow service role (webhook) to insert emails
create policy "Allow service role to insert emails"
on public.emails
for insert
to service_role
with check (true);

-- Create policy to allow authenticated users to update emails (mark as read)
create policy "Allow authenticated users to update emails"
on public.emails
for update
to authenticated
using (true);
`;

async function runMigration() {
  try {
    console.log('Running migration to create emails table...');
    
    // Execute the SQL using the rpc function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('Result:', data);
    
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();