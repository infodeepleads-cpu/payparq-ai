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

// SQL to create emails table - simplified version without policies first
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
`;

async function runMigration() {
  try {
    console.log('Running migration to create emails table...');
    
    // Try using the direct SQL endpoint through PostgREST
    // We'll use the service role key to bypass RLS and create the table
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Migration failed:', response.status, errorText);
      
      // Let's try a different approach - use the SQL editor directly
      console.log('\nSince the API approach failed, here is the SQL you need to run manually:');
      console.log('\n--- COPY AND PASTE THIS SQL IN SUPABASE DASHBOARD ---\n');
      console.log(migrationSQL);
      console.log('\n--- END OF SQL ---\n');
      console.log('Steps to run this SQL:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project (iafjygownkhedereaoxw)');
      console.log('3. Go to SQL Editor in the left sidebar');
      console.log('4. Paste the SQL above and click Run');
      
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    const result = await response.json();
    console.log('Result:', result);
    
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();