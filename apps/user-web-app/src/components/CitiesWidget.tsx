'use client';

import { CITIES } from '@/data/cities';
import { useLocale } from '@/components/LocaleProvider';

export function CitiesWidget() {
  const { locale } = useLocale();
  const cities = Object.values(CITIES);

  return (
    <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
        {locale === 'en' ? 'Explore Parking in Croatian Cities' : 'Pronađite Parking u Hrvatskim Gradovima'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <a
            key={city.id}
            href={`/city/${city.id}`}
            className="group block p-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
          >
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 mb-2">
              {city.name}
            </h3>
            <p className="text-xs text-white/60 line-clamp-2">
              {city.description}
            </p>
            <p className="text-[11px] text-white/40 mt-2">
              {city.region}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
