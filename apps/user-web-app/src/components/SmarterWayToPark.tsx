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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      </div>
    </section>
  );
}
