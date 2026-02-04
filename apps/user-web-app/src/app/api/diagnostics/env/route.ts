import { NextResponse } from 'next/server';
import { supabaseUrl } from '@/lib/supabase';

export async function GET() {
  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = typeof urlEnv === 'string' && urlEnv.length > 0;
  const hasAnon = typeof anonEnv === 'string' && anonEnv.length > 0;
  const hasService = typeof serviceRole === 'string' && serviceRole.length > 0;
  return NextResponse.json({
    supabase_client_enabled: hasUrl && hasAnon,
    NEXT_PUBLIC_SUPABASE_URL_present: hasUrl,
    NEXT_PUBLIC_SUPABASE_URL_sample: hasUrl ? urlEnv.slice(0, 12) : null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: hasAnon,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_length: hasAnon ? anonEnv.length : 0,
    SUPABASE_SERVICE_ROLE_KEY_present: hasService,
    supabaseUrl_export_present: typeof supabaseUrl === 'string' && supabaseUrl.length > 0,
  });
}
