import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function convertUtcToCet(utcIsoString: string | null): string | null {
  if (!utcIsoString) return null;
  const date = new Date(utcIsoString);
  const cetFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = cetFormatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}`;
}

function convertUtcToIso(utcIsoString: string | null): string | null {
  if (!utcIsoString) return null;
  const date = new Date(utcIsoString);
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  const expectedApiKey = process.env.PARKFLOW_API_KEY;

  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sinceParam = request.nextUrl.searchParams.get('since');
  if (!sinceParam) {
    return NextResponse.json({ error: 'Missing "since" parameter' }, { status: 400 });
  }

  let sinceDate: Date;
  try {
    sinceDate = new Date(sinceParam);
    if (Number.isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: 'Invalid ISO timestamp for "since"' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid ISO timestamp for "since"' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('parking_sessions')
      .select('id, location_id, plate, email, price, currency, entry_time, exit_time, status, payment_status, created_at, updated_at')
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ ParkFlow API error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const bookings = (sessions || []).map((session: any) => ({
      reference_number: session.id,
      status: session.payment_status === 'paid' ? 'confirmed' : 'pending',
      arrival: convertUtcToCet(session.entry_time),
      departure: convertUtcToCet(session.exit_time),
      created_at: convertUtcToIso(session.created_at),
      updated_at: convertUtcToIso(session.updated_at),
      price: Math.round(session.price * 100),
      currency: (session.currency || 'EUR').toUpperCase(),
      vehicles: 1,
      license_plates: session.plate ? [session.plate] : [],
      location_id: session.location_id,
      customer_email: session.email,
    }));

    return NextResponse.json(bookings);
  } catch (err) {
    console.error('❌ ParkFlow API exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
