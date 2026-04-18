import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/service-requests/messages?request_id=xxx
export async function GET(req: NextRequest) {
  const request_id = req.nextUrl.searchParams.get('request_id');
  if (!request_id) return NextResponse.json({ error: 'missing_request_id' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data, error } = await client
    .from('service_messages')
    .select('id,sender,body,created_at')
    .eq('request_id', request_id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/service-requests/messages
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { request_id, sender, body: msgBody } = body as Record<string, string>;
  if (!request_id || !sender || !msgBody?.trim()) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data, error } = await client
    .from('service_messages')
    .insert({ request_id, sender, body: msgBody.trim() })
    .select('id,sender,body,created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
