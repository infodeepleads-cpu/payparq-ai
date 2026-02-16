import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create client if both URL and key are provided and not placeholders
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey && 
  !supabaseUrl.includes('placeholder') && !supabaseServiceRoleKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
