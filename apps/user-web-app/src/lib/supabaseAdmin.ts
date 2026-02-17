import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create client if both URL and key are provided and not placeholders
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey && 
  !supabaseUrl.includes('placeholder') && !supabaseServiceRoleKey.includes('placeholder') &&
  isValidUrl(supabaseUrl))
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
