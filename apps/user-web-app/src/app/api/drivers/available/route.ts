import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ available: false });

  const { count } = await client
    .from('drivers')
    .select('id', { count: 'exact', head: true })
    .eq('is_online', true);

  return NextResponse.json({ available: (count ?? 0) > 0 });
}
