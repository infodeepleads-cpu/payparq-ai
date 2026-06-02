'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  airport: string;
}

interface AirportReviewsProps {
  airport: string;
  locationName: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AirportReviews({ airport, locationName }: AirportReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('parking_reviews')
          .select('*')
          .eq('airport', airport)
          .order('date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setReviews(data);
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(parseFloat(avg.toFixed(1)));
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [airport]);

  if (loading || !reviews.length) {
    return null;
  }

  const reviewsToDisplay = reviews.slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AggregateRating',
            itemReviewed: {
              '@type': 'LocalBusiness',
              name: locationName,
            },
            ratingValue: averageRating,
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          }),
        }}
      />

      {reviewsToDisplay.map((review, idx) => (
        <script
          key={`review-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Review',
              itemReviewed: {
                '@type': 'LocalBusiness',
                name: locationName,
              },
              author: {
                '@type': 'Person',
                name: review.author,
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
              },
              reviewBody: review.text,
              datePublished: review.date,
            }),
          }}
        />
      ))}

      <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 border-b border-black/10">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.round(averageRating) ? 'fill-black text-black' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-black">{averageRating}</span>
            </div>
            <p className="text-sm text-black/60">{reviews.length} customer reviews</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviewsToDisplay.map((review) => (
            <div key={review.id} className="border border-black/10 rounded-lg p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-black text-sm">{review.author}</p>
                  <p className="text-xs text-black/50">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < review.rating ? 'fill-black text-black' : 'text-gray-300'}
                  />
                ))}
              </div>

              <p className="text-sm text-black/70 line-clamp-3">{review.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
