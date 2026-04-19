import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/service-requests/rate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const { request_id, rating, tip } = body as { request_id: string; rating: number; tip?: number };
    if (!request_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'invalid_params' }, { status: 400 });
    }

    const client = supabaseAdmin;
    if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

    // Get the request to find driver_id
    const { data: serviceRequest, error: reqErr } = await client
      .from('service_requests')
      .select('driver_id, status')
      .eq('id', request_id)
      .single();

    if (reqErr || !serviceRequest) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (!serviceRequest.driver_id) return NextResponse.json({ error: 'no_driver' }, { status: 400 });

    // Get current driver rating + count
    const { data: driverData, error: driverErr } = await client
      .from('drivers')
      .select('rating, ratings_count')
      .eq('id', serviceRequest.driver_id)
      .single();

    if (driverErr || !driverData) return NextResponse.json({ error: 'driver_not_found' }, { status: 404 });

    const oldRating = Number(driverData.rating ?? 5.0);
    const oldCount = Number(driverData.ratings_count ?? 0);
    const newCount = oldCount + 1;
    const newRating = Math.round(((oldRating * oldCount + rating) / newCount) * 10) / 10;

    const { error: updateErr } = await client
      .from('drivers')
      .update({ rating: newRating, ratings_count: newCount })
      .eq('id', serviceRequest.driver_id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Log tip on the request (optional, no charge)
    if (tip && tip > 0) {
      await client.from('service_requests').update({ eta_minutes: tip }).eq('id', request_id);
    }

    return NextResponse.json({ ok: true, new_rating: newRating });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
