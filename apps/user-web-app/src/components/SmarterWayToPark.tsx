'use client';

import { useLocale } from '@/components/LocaleProvider';
import { Search, Calendar, Ticket } from 'lucide-react';

export function SmarterWayToPark() {
  const { locale } = useLocale();

  const title = locale === 'hr' ? 'Pametniji Način Parkiranja' : 'The Smarter Way to Park';
  const steps = locale === 'hr'
    ? [
        { icon: Search, label: 'Pronađi', description: 'Pretraži dostupne prostore' },
        { icon: Calendar, label: 'Rezerviraj', description: 'Osiguraj svoje mjesto' },
        { icon: Ticket, label: 'Dozvola', description: 'Digitalna parking dozvola' },
      ]
    : [
        { icon: Search, label: 'Search', description: 'Find available spaces' },
        { icon: Calendar, label: 'Book', description: 'Reserve your spot' },
        { icon: Ticket, label: 'Pass', description: 'Digital parking pass' },
      ];

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.label}</h3>
                <p className="text-sm text-white/80">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a
            href="https://apps.apple.com/app/payparq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition shadow-lg"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 13.5c-.02-1.95 1.58-2.9 1.65-2.94-.9-1.31-2.3-1.49-2.8-1.51-1.19-.12-2.33.7-2.94.7-.61 0-1.55-.68-2.55-.66-1.31.02-2.52.76-3.2 1.92-1.36 2.36-.35 5.85 1 7.77.67.98 1.46 2.08 2.5 2.04 1-.04 1.37-.66 2.57-.66 1.19 0 1.52.66 2.56.64 1.06-.02 1.73-.99 2.39-1.97.75-1.09 1.06-2.15 1.08-2.2-.03-.01-2.07-.8-2.09-3.14zm-2.47-7.12c.55-.67.92-1.6.82-2.53-.79.03-1.77.53-2.35 1.19-.51.59-.96 1.54-.84 2.44.88.07 1.79-.44 2.37-1.1z"/>
            </svg>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-700">Download on</div>
              <div className="text-lg font-bold text-black">App Store</div>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.payparq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition shadow-lg"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186c-.451.451-.677 1.068-.677 1.686v-23.744c0-.619.226-1.235.677-1.686zm16.959 8.186L7.807 2.632 3.61 6.83l12.161 5.17-12.16 5.168L7.807 21.368l12.761-8.368z"/>
            </svg>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-700">Get it on</div>
              <div className="text-lg font-bold text-black">Google Play</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
