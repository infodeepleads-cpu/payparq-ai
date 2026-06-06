'use client';

import { Search, MousePointerClick, Ticket } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

interface HowItWorksProps {
  airport?: string;
}

const STEPS_EN = [
  {
    num: 1,
    icon: Search,
    title: 'Find',
    desc: 'Browse verified parking spaces with real-time availability and pricing.',
  },
  {
    num: 2,
    icon: MousePointerClick,
    title: 'Select',
    desc: 'Choose your spot and confirm. Instant confirmation delivered to your email.',
  },
  {
    num: 3,
    icon: Ticket,
    title: 'Parking Pass',
    desc: 'Receive your digital parking pass instantly. Show it on arrival — no printing needed.',
  },
];

const STEPS_HR = [
  {
    num: 1,
    icon: Search,
    title: 'Pronađi',
    desc: 'Pregledajte provjerena parkirna mjesta s dostupnošću i cijenama u stvarnom vremenu.',
  },
  {
    num: 2,
    icon: MousePointerClick,
    title: 'Odaberi',
    desc: 'Odaberite svoje mjesto i potvrdite. Trenutna potvrda dostavljena na vašu e-poštu.',
  },
  {
    num: 3,
    icon: Ticket,
    title: 'Parking dozvola',
    desc: 'Primite digitalnu parking dozvolu trenutno. Pokažite je pri dolasku — nije potrebno ispisivanje.',
  },
];

export function HowItWorks({ airport = 'Airport' }: HowItWorksProps) {
  const { locale } = useLocale();
  const steps = locale === 'hr' ? STEPS_HR : STEPS_EN;
  const howItWorksTitle = locale === 'hr' ? 'Kako to radi' : 'How It Works';

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-4xl mx-auto">

        {/* How It Works */}
        <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">
          {howItWorksTitle}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">{step.title}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
