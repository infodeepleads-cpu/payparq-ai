import { readFileSync } from 'fs';

// Read .env.local file
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!supabaseUrl || !supabaseServiceKey || !projectRef) {
  console.error('Missing Supabase environment variables or invalid URL');
  console.log('Found vars:', Object.keys(envVars));
  process.exit(1);
}

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);
console.log('Project ref:', projectRef);
console.log('Service key present:', !!supabaseServiceKey);

// SQL to create emails table
const migrationSQL = `
-- Create emails table to store incoming messages
create table if not exists public.emails (
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

-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text,
  auth text,
  ua text,
  created_at timestamp with time zone not null default now()
);

-- Create reminders table
create table if not exists public.reminders (
  id uuid not null default gen_random_uuid(),
  title text not null,
  scheduled_at timestamp with time zone not null,
  fired boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint reminders_pkey primary key (id)
);

-- Enable RLS for reminders
alter table public.reminders enable row level security;

-- Policies for reminders
create policy "Allow authenticated users to read reminders"
on public.reminders
for select
to authenticated
using (true);

create policy "Allow service role to insert reminders"
on public.reminders
for insert
to service_role
with check (true);
`;

async function runMigration() {
  try {
    console.log('Running migration to create emails table...');
    
    // Use the Supabase Management API to execute SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: migrationSQL,
        name: 'Create emails table for inbound webhook'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Migration failed:', result);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('Result:', result);
    
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
