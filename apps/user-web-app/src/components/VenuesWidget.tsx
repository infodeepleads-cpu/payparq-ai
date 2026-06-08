'use client';

import { VENUES } from '@/data/venues';
import { useLocale } from '@/components/LocaleProvider';

export function VenuesWidget() {
  const { locale } = useLocale();
  const venues = Object.values(VENUES).slice(0, 6);

  return (
    <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
        {locale === 'en' ? 'Parking for Matches & Events' : 'Parking za Utakmice i Događanja'}
      </p>
      <div className="flex flex-wrap gap-3">
        {venues.map((venue) => (
          <a
            key={venue.id}
            href={`/venue/${venue.id}`}
            className="text-xs text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-2 transition-all"
          >
            {venue.name}
          </a>
        ))}
      </div>
    </div>
  );
}
