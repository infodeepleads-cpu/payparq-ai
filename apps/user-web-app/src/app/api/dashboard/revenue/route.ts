import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('owner_ledger')
    .select('payparq_reserved_cents, created_at')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCents = (data || []).reduce(
    (sum, e) => sum + (e.payparq_reserved_cents || 0),
    0
  );

  return NextResponse.json({
    date: today,
    total_cents: totalCents,
    total_eur: (totalCents / 100).toFixed(2),
    booking_count: (data || []).length,
  });
}
