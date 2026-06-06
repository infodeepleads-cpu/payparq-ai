'use client';

import { Check } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

interface WhyPayParqProps {
  airport?: string;
}

const BENEFITS_EN = [
  {
    title: 'Guaranteed Parking Space',
    description: 'Your spot is reserved and waiting for you. No searching, no disappointments.',
  },
  {
    title: 'Reserve in 2 Minutes',
    description: 'Fast and simple booking process with instant confirmation.',
  },
  {
    title: 'Save Up to 70%',
    description: 'Significantly cheaper than airport parking with guaranteed quality.',
  },
];

const BENEFITS_HR = [
  {
    title: 'Zajamčeno parkirno mjesto',
    description: 'Vaše mjesto je rezervirano i čeka vas. Bez pretraživanja, bez razočaranja.',
  },
  {
    title: 'Rezervirajte u 2 minute',
    description: 'Brz i jednostavan proces rezervacije s trenutnom potvrdom.',
  },
  {
    title: 'Uštedite do 70%',
    description: 'Znatno jeftiniji od parkinga u zračnoj luci uz zajamčenu kvalitetu.',
  },
];

export function WhyPayParq({ airport = 'Airport' }: WhyPayParqProps) {
  const { locale } = useLocale();
  const benefits = locale === 'hr' ? BENEFITS_HR : BENEFITS_EN;
  const whyPayParqTitle = locale === 'hr' ? 'Zašto PayParq?' : 'Why PayParq?';

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-4xl mx-auto">
        <div className="border-t border-black/10 pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">{whyPayParqTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={13} />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">{b.title}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
