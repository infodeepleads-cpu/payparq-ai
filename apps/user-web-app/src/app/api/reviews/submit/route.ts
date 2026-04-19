import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const { token, score_security, score_accessibility, score_cleanliness, score_staff, score_value, score_location, comment } = body as Record<string, unknown>;

    if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const scores = [score_security, score_accessibility, score_cleanliness, score_staff, score_value, score_location] as number[];
    if (scores.some((s) => !s || s < 1 || s > 10)) {
      return NextResponse.json({ error: 'invalid_scores' }, { status: 400 });
    }

    const client = supabaseAdmin;
    if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

    const { data: existing, error: fetchErr } = await client
      .from('parking_reviews')
      .select('id,location_id,submitted_at')
      .eq('review_token', token as string)
      .single();

    if (fetchErr || !existing) return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
    if (existing.submitted_at) return NextResponse.json({ error: 'already_submitted' }, { status: 409 });

    const overall = Math.round((scores.reduce((a, b) => a + b, 0) / 6) * 10) / 10;

    const { error: updateErr } = await client
      .from('parking_reviews')
      .update({
        score_security, score_accessibility, score_cleanliness,
        score_staff, score_value, score_location,
        overall_score: overall,
        comment: (comment as string)?.trim() || null,
        submitted_at: new Date().toISOString(),
      })
      .eq('review_token', token as string);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Recompute location aggregate scores
    if (existing.location_id) {
      const { data: allReviews } = await client
        .from('parking_reviews')
        .select('score_security,score_accessibility,score_cleanliness,score_staff,score_value,score_location,overall_score')
        .eq('location_id', existing.location_id)
        .not('submitted_at', 'is', null);

      if (allReviews && allReviews.length > 0) {
        const avg = (field: string) =>
          Math.round((allReviews.reduce((sum: number, r: Record<string, number>) => sum + (r[field] ?? 0), 0) / allReviews.length) * 10) / 10;

        await client.from('locations').update({
          review_count: allReviews.length,
          review_score: avg('overall_score'),
          review_scores: {
            security: avg('score_security'),
            accessibility: avg('score_accessibility'),
            cleanliness: avg('score_cleanliness'),
            staff: avg('score_staff'),
            value: avg('score_value'),
            location: avg('score_location'),
          },
        }).eq('id', existing.location_id);
      }
    }

    return NextResponse.json({ ok: true, overall_score: overall });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// GET /api/reviews/submit?location_id=xxx — fetch reviews for a location (public)
export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('location_id');
  if (!locationId) return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data } = await client
    .from('parking_reviews')
    .select('overall_score,score_security,score_accessibility,score_cleanliness,score_staff,score_value,score_location,comment,submitted_at')
    .eq('location_id', locationId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ reviews: data ?? [] });
}
