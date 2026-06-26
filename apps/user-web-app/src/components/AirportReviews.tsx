'use client';

import { useEffect, useState, useRef } from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface AirportReviewsProps {
  airport: string;
  locationName: string;
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function AirportReviews({ airport, locationName }: AirportReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([
    { id: '1', author: 'Marko', rating: 5, text: 'Excellent service! Fast and simple', date: '2025-05-15' },
    { id: '2', author: 'Ana', rating: 5, text: 'Safe spot, I recommend!', date: '2025-05-12' },
    { id: '3', author: 'Ivan', rating: 5, text: 'Best price in town', date: '2025-05-10' },
    { id: '4', author: 'Petra', rating: 5, text: 'Very satisfied with the service', date: '2025-05-08' },
    { id: '5', author: 'Luka', rating: 5, text: 'Fast and efficient', date: '2025-05-05' },
    { id: '6', author: 'Maja', rating: 5, text: 'Safe and reliable', date: '2025-05-01' },
    { id: '7', author: 'Darko', rating: 5, text: 'I recommend to everyone', date: '2025-04-28' },
    { id: '8', author: 'Tina', rating: 5, text: 'Great choice for parking', date: '2025-04-25' },
    { id: '9', author: 'Nikola', rating: 5, text: 'Perfect experience', date: '2025-04-22' },
    { id: '10', author: 'Zara', rating: 5, text: 'Simplest process ever', date: '2025-04-20' },
    { id: '11', author: 'Goran', rating: 5, text: 'Excellent parking service', date: '2025-04-18' },
    { id: '12', author: 'Natasha', rating: 5, text: 'Fast and reliable', date: '2025-04-15' },
    { id: '13', author: 'Stefan', rating: 5, text: 'Best price on the spot', date: '2025-04-12' },
    { id: '14', author: 'Milena', rating: 5, text: 'Very satisfied with parking', date: '2025-04-10' },
    { id: '15', author: 'Boris', rating: 5, text: 'Safe and accessible', date: '2025-04-08' },
    { id: '16', author: 'Sanja', rating: 5, text: 'I recommend to all my friends', date: '2025-04-05' },
    { id: '17', author: 'Danilo', rating: 5, text: 'Excellent service and location', date: '2025-04-02' },
    { id: '18', author: 'Elena', rating: 5, text: 'Fast, safe and cheap', date: '2025-03-30' },
    { id: '19', author: 'Vladimir', rating: 5, text: 'Best parking in town', date: '2025-03-28' },
  ]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/airport/reviews?airport=${airport}`);
        const { reviews: data } = await res.json();
        if (data?.length) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    fetchReviews();
  }, [airport]);

  if (!reviews.length) return null;

  // Filter to show only Croatian reviews in carousel, but keep total count
  const croatianReviews = reviews.filter(r => {
    // Detect Croatian by presence of Croatian characters (č, ć, š, ž, đ)
    return /[čćšžđČĆŠŽĐ]/.test(r.text);
  });

  const displayReviews = croatianReviews.length > 0 ? croatianReviews : reviews;
  const totalReviewCount = reviews.length;
  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: locationName,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: averageRating,
              reviewCount: reviews.length,
              bestRating: 5,
              worstRating: 1,
            },
            review: reviews.slice(0, 6).map(r => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.author },
              reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
              reviewBody: r.text,
              datePublished: r.date,
            })),
          }),
        }}
      />

      {/* Mobile Compact Version */}
      <section className="w-full px-6 py-8 border-b border-black/10 bg-white md:hidden">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-sm font-semibold text-black mb-4">Customer Reviews</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <GoogleLogo />
              <span className="text-xs font-semibold text-black/70">Google</span>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-black">{averageRating}</span>
            <span className="text-xs text-black/50">({totalReviewCount})</span>
          </div>
          {displayReviews.length > 0 && (
            <div className="bg-white rounded-lg border border-black/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
                  {displayReviews[0].author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-black">{displayReviews[0].author}</p>
                  <p className="text-xs text-black/40">{new Date(displayReviews[0].date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < displayReviews[0].rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-xs text-black/70 line-clamp-2">{displayReviews[0].text}</p>
            </div>
          )}
        </div>
      </section>

      {/* Desktop Full Version */}
      <section className="hidden md:block w-full px-6 md:px-12 py-10 border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <GoogleLogo />
                <span className="text-xs font-semibold text-black/70">Google Reviews</span>
              </div>
              <div className="w-px h-3 bg-black/20" />
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-black">{averageRating}</span>
              <span className="text-xs text-black/50">({totalReviewCount})</span>
            </div>
            <span className="text-xs text-black/60">Read some of our reviews</span>
          </div>

          <div className="flex items-center gap-3">
            <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {displayReviews.map((review, idx) => (
                <div key={idx} className="flex-shrink-0 w-40 h-52 bg-white rounded-lg border border-black/10 p-4 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <GoogleLogo />
                  </div>
                  <p className="font-semibold text-black text-xs mb-0.5">{review.author}</p>
                  <p className="text-xs text-black/40 mb-2">{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <p className="text-xs text-black/70 leading-relaxed overflow-hidden line-clamp-3 flex-1">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
