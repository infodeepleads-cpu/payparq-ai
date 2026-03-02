import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUser() {
  const targetEmail = 'pension.zamic@gmail.com';
  console.log(`Provjera korisnika: ${targetEmail}`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Greška pri dohvaćanju korisnika:', error);
    return;
  }

  const user = users.find(u => u.email === targetEmail);

  if (!user) {
    console.log('Korisnik nije pronađen.');
    return;
  }

  console.log('Korisnik pronađen:');
  console.log('ID:', user.id);
  console.log('Email potvrđen:', user.email_confirmed_at ? 'DA (' + user.email_confirmed_at + ')' : 'NE');
  console.log('Zadnja prijava:', user.last_sign_in_at || 'Nikada');
  console.log('Metadata:', user.user_metadata);

  if (!user.email_confirmed_at) {
    console.log('Pokušavam prisilno potvrditi email...');
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Greška pri potvrdi:', updateError);
    } else {
      console.log('Email uspješno potvrđen putem admin API-ja!');
    }
  } else {
    console.log('Email je već bio potvrđen.');
  }
}

checkUser();
