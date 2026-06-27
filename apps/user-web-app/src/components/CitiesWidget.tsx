'use client';

import { CITIES } from '@/data/cities';
import { useLocale } from '@/components/LocaleProvider';

export function CitiesWidget() {
  const { locale } = useLocale();
  const cities = Object.values(CITIES);

  return (
    <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
        {locale === 'en' ? 'Explore Parking in Croatian Cities' : 'Pronađite Parking u Gradovima'}
      </p>
      <div className="flex flex-wrap gap-3">
        {cities.map((city) => (
          <a
            key={city.id}
            href={`/city/${city.id}`}
            className="text-xs text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-2 transition-all"
          >
            {city.name}
          </a>
        ))}
      </div>
    </div>
  );
}
