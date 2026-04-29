import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get('session')?.trim();
  if (!session) {
    return NextResponse.redirect(new URL('/members', req.url));
  }

  const db = supabaseAdmin;
  if (!db) {
    return NextResponse.redirect(new URL('/members', req.url));
  }

  const { data } = await db
    .from('service_requests')
    .select('id,type')
    .eq('session_id', session)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    // No request yet — send to success page so they can summon
    return NextResponse.redirect(new URL(`/success?session_id=${encodeURIComponent(session)}`, req.url));
  }

  const type = (data.type as string) === 'valet' ? 'valet' : 'shuttle';
  return NextResponse.redirect(new URL(`/track?id=${data.id}&type=${type}`, req.url));
}
