'use client';

import { Check, Search, MousePointerClick, Ticket } from 'lucide-react';

interface HowItWorksProps {
  airport?: string;
}

const STEPS = [
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

const BENEFITS = [
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

export function HowItWorks({ airport = 'Airport' }: HowItWorksProps) {
  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-4xl mx-auto">

        {/* How It Works */}
        <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {STEPS.map((step) => {
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
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">Why PayParq?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((b, idx) => (
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
