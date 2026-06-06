'use client';

import { Check, Search, MousePointerClick, Ticket } from 'lucide-react';
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
    description: 'Znatno jeftinije od aerodromskog parkinga s zajamčenom kvalitetom.',
  },
];

export function HowItWorks({ airport = 'Airport' }: HowItWorksProps) {
  const { locale } = useLocale();
  const steps = locale === 'hr' ? STEPS_HR : STEPS_EN;
  const benefits = locale === 'hr' ? BENEFITS_HR : BENEFITS_EN;
  const howItWorksTitle = locale === 'hr' ? 'Kako to radi' : 'How It Works';
  const whyPayParqTitle = locale === 'hr' ? 'Zašto PayParq?' : 'Why PayParq?';

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-4xl mx-auto">

        {/* How It Works */}
        <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">
          {howItWorksTitle}
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
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

        {/* Why PayParq */}
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
