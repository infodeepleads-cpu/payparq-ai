import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId required' }, { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY not configured');
    return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 });
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=reviews,rating,userRatingCount&key=${GOOGLE_PLACES_API_KEY}`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`Places API error: ${response.status}`);
      return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 });
    }

    const data = await response.json();
    const reviews = (data.reviews || []).map((review: any) => ({
      author_name: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating || 0,
      text: review.originalText?.text || '',
      time: Math.floor(new Date(review.publishTime).getTime() / 1000) || Date.now() / 1000,
      profile_photo_url: review.authorAttribution?.photoUri || undefined,
    }));

    return NextResponse.json({
      reviews,
      averageRating: data.rating || 0,
      totalReviews: data.userRatingCount || 0,
    });
  } catch (error) {
    console.error('Failed to fetch Google Places reviews:', error);
    return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 });
  }
}
