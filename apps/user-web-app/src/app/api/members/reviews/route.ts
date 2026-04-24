import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'missing_email' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data: reviews, error } = await client
    .from('parking_reviews')
    .select('id,location_id,overall_score,score_security,score_accessibility,score_cleanliness,score_staff,score_value,score_location,comment,submitted_at,email_sent_at')
    .eq('member_email', email)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!reviews || reviews.length === 0) return NextResponse.json({ reviews: [] });

  // Fetch location names in one query
  const locationIds = [...new Set(reviews.map((r) => r.location_id).filter(Boolean))] as string[];
  let locationNames: Record<string, string> = {};
  if (locationIds.length > 0) {
    const { data: locs } = await client
      .from('locations')
      .select('id,name')
      .in('id', locationIds);
    if (locs) {
      locationNames = Object.fromEntries(locs.map((l) => [l.id, l.name]));
    }
  }

  const enriched = reviews.map((r) => ({
    ...r,
    location_name: r.location_id ? (locationNames[r.location_id] ?? null) : null,
  }));

  return NextResponse.json({ reviews: enriched });
}
