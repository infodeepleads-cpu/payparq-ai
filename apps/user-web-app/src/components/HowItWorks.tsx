'use client';

import { Check } from 'lucide-react';

interface HowItWorksProps {
  airport?: string;
}

const STEPS = [
  {
    num: 1,
    title: 'Search',
    desc: 'Browse verified parking spaces near the airport with real-time availability and pricing.',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=400&fit=crop&auto=format&q=80',
  },
  {
    num: 2,
    title: 'Book',
    desc: 'Secure your spot with a quick checkout. Instant confirmation sent to your email.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=400&fit=crop&auto=format&q=80',
  },
  {
    num: 3,
    title: 'Get Your Parking Pass',
    desc: 'Receive your digital parking pass immediately. Show it on arrival — no printing needed.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&h=400&fit=crop&auto=format&q=80',
  },
];

const BENEFITS = [
  {
    title: 'Guaranteed Parking Spot',
    description: 'Your space is reserved and waiting. No searching, no disappointment.',
  },
  {
    title: 'Book in 2 Minutes',
    description: 'Fast, simple booking process with instant confirmation.',
  },
  {
    title: 'Save Up to 70%',
    description: 'Much cheaper than airport parking with guaranteed quality.',
  },
];

export function HowItWorks({ airport = 'Airport' }: HowItWorksProps) {
  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto">

        {/* How It Works */}
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black mb-12">
          How It Works
        </h2>

        <div className="space-y-16 mb-20">
          {STEPS.map((step, idx) => (
            <div
              key={step.num}
              className={`grid md:grid-cols-2 gap-10 items-center ${idx % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
            >
              <div className={idx % 2 === 1 ? 'md:[direction:ltr]' : ''}>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">{step.title}</h3>
                <p className="text-black/60 leading-relaxed">{step.desc}</p>
              </div>
              <div className={`rounded-2xl overflow-hidden shadow-md h-64 md:h-72 ${idx % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Why Choose PayParq — horizontal */}
        <div className="border-t border-black/10 pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">Why Choose PayParq?</h2>
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
