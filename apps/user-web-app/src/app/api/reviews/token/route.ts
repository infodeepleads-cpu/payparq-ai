import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data, error } = await client
    .from('parking_reviews')
    .select('id,session_id,location_id,member_email,submitted_at')
    .eq('review_token', token)
    .single();

  if (error || !data) return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
  if (data.submitted_at) return NextResponse.json({ error: 'already_submitted', submitted_at: data.submitted_at }, { status: 409 });

  // Fetch location name
  let locationName = null;
  if (data.location_id) {
    const { data: loc } = await client.from('locations').select('name').eq('id', data.location_id).single();
    locationName = loc?.name ?? null;
  }

  return NextResponse.json({ review_id: data.id, location_name: locationName, member_email: data.member_email });
}
