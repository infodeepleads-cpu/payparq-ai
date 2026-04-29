import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('location_id')?.trim() ?? '';
  if (!locationId) {
    return NextResponse.json({ error: 'missing location_id' }, { status: 400 });
  }

  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  const { data: spots, error } = await client
    .from('spots')
    .select('id,label,row_num,col_num,lat,lng,price_modifier_cents')
    .eq('location_id', locationId)
    .eq('active', true)
    .order('row_num', { ascending: true })
    .order('col_num', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!spots || spots.length === 0) {
    return NextResponse.json({ spots: [] });
  }

  // Find taken spot IDs (active assignments)
  const spotIds = (spots as { id: string }[]).map((s) => s.id);
  const { data: assignments } = await client
    .from('spot_assignments')
    .select('spot_id')
    .in('spot_id', spotIds)
    .eq('status', 'active');

  const takenIds = new Set(
    (assignments as { spot_id: string }[] | null)?.map((a) => a.spot_id) ?? []
  );

  const result = (spots as {
    id: string; label: string; row_num: number | null; col_num: number | null;
    lat: number | null; lng: number | null; price_modifier_cents: number;
  }[]).map((s) => ({
    ...s,
    available: !takenIds.has(s.id),
  }));

  return NextResponse.json({ spots: result });
}
