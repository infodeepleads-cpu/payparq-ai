import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Found vars:', Object.keys(envVars));
  process.exit(1);
}

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service key present:', !!supabaseServiceKey);

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
    
    // First, let's check if the table already exists
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'emails');
    
    if (checkError) {
      console.error('Error checking table existence:', checkError);
    } else if (tableExists && tableExists.length > 0) {
      console.log('Emails table already exists!');
      return;
    }
    
    // Try to execute the SQL using the rpc function
    console.log('Attempting to create table...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('Migration failed:', error);
      
      // If exec_sql doesn't exist, try alternative approach
      if (error.message.includes('exec_sql')) {
        console.log('Trying alternative approach...');
        
        // Let's try to run each statement separately
        const statements = migrationSQL.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log('Executing:', statement.trim().substring(0, 50) + '...');
            const { error: stmtError } = await supabase.rpc('exec_sql', { 
              sql: statement + ';' 
            });
            
            if (stmtError) {
              console.error('Statement failed:', stmtError);
              // Continue with other statements
            }
          }
        }
      }
      
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