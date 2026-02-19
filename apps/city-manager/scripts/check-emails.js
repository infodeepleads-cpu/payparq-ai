import { createClient } from '@supabase/supabase-js';
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

async function checkEmails() {
  try {
    console.log('Checking emails table...');
    
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error checking emails:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} emails in the database:`);
      data.forEach((email, index) => {
        console.log(`${index + 1}. From: ${email.from_address}`);
        console.log(`   To: ${email.to_address}`);
        console.log(`   Subject: ${email.subject || '(no subject)'}`);
        console.log(`   Created: ${email.created_at}`);
        console.log(`   Read: ${email.read}`);
        console.log('');
      });
    } else {
      console.log('No emails found in the database yet.');
    }
    
  } catch (err) {
    console.error('Error checking emails:', err);
  }
}

checkEmails();