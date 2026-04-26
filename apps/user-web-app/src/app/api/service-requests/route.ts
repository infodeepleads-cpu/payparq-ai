import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/service-requests — guest creates a request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const { type, location_id, session_id, ticket_no, guest_name, pickup_label,
            pickup_lat, pickup_lng, plate, parking_zone } = body as Record<string, unknown>;

    if (!type || !['shuttle', 'valet'].includes(type as string)) {
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeLocationId = (typeof location_id === 'string' && UUID_RE.test(location_id))
      ? location_id : null;

    const client = supabaseAdmin;
    if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

    const { data, error } = await client
      .from('service_requests')
      .insert({
        type,
        location_id: safeLocationId,
        session_id: session_id ?? null,
        ticket_no: ticket_no ?? null,
        guest_name: guest_name ?? null,
        pickup_label: pickup_label ?? null,
        pickup_lat: pickup_lat ?? null,
        pickup_lng: pickup_lng ?? null,
        plate: plate ?? null,
        parking_zone: parking_zone ?? null,
        status: 'pending',
      })
      .select('id,type,status,eta_minutes,driver_id')
      .single();

    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });

    // Find officer assigned to this lot and notify them
    if (safeLocationId && data) {
      const { data: assignments } = await client
        .from('officer_assignments')
        .select('officer_id')
        .eq('lot_id', safeLocationId)
        .eq('is_active', true)
        .limit(1);

      const officerId = assignments?.[0]?.officer_id;
      if (officerId) {
        const { data: sub } = await client
          .from('push_subscriptions')
          .select('fcm_token, endpoint, p256dh, auth')
          .eq('user_id', officerId)
          .limit(1)
          .maybeSingle();

        if (sub?.fcm_token && process.env.FIREBASE_SERVER_KEY) {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `key=${process.env.FIREBASE_SERVER_KEY}` },
            body: JSON.stringify({
              to: sub.fcm_token,
              notification: { title: `${type === 'valet' ? 'Valet' : 'Shuttle'} request`, body: `New ${type} request at your lot` },
              data: { type: 'service_request', request_id: data.id, service_type: type },
            }),
          }).catch(() => null);
        }
      }
    }

    return NextResponse.json({ request: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[service-requests POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/service-requests — officer accepts or completes a request
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const { id, action } = body as { id?: string; action?: string };
    const officerId = req.headers.get('x-user-id');

    if (!id || !action || !officerId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const client = supabaseAdmin;
    if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

    const statusMap: Record<string, string> = {
      accept: 'accepted',
      arrive: 'arrived',
      done: 'done',
      cancel: 'cancelled',
    };

    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: 'invalid_action' }, { status: 400 });

    const update: Record<string, unknown> = { status: newStatus };
    if (action === 'accept') update.driver_id = officerId;

    const { data, error } = await client
      .from('service_requests')
      .update(update)
      .eq('id', id)
      .select('id,type,status,driver_id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
