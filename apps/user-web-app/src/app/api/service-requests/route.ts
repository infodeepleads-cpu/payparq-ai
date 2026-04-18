import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/service-requests — guest creates a request
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { type, location_id, session_id, ticket_no, guest_name, pickup_label,
          pickup_lat, pickup_lng, plate, parking_zone } = body as Record<string, string | number>;

  if (!type || !['shuttle', 'valet'].includes(type as string)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data, error } = await client
    .from('service_requests')
    .insert({
      type, location_id, session_id, ticket_no, guest_name,
      pickup_label, pickup_lat, pickup_lng,
      plate: plate ?? null,
      parking_zone: parking_zone ?? null,
      status: 'pending',
    })
    .select('id,type,status,eta_minutes,driver_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}

// GET /api/service-requests?id=xxx — poll request + driver info
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data: request, error } = await client
    .from('service_requests')
    .select('id,type,status,eta_minutes,driver_id,pickup_lat,pickup_lng,pickup_label,plate,parking_zone,ticket_no')
    .eq('id', id)
    .single();

  if (error || !request) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let driver = null;
  if (request.driver_id) {
    const { data: d } = await client
      .from('drivers')
      .select('id,name,plate,rating,avatar_initials,vehicle_model,last_location,is_online')
      .eq('id', request.driver_id)
      .single();
    driver = d;
  }

  return NextResponse.json({ request, driver });
}
