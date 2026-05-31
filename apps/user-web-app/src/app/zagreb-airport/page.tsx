'use client';

import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { ArrowRight, Check } from 'lucide-react';

export default function ZagrebAirportPage() {
  const router = useRouter();

  const handleBookNow = () => {
    router.push('/search?lat=45.7429&lng=16.0688&name=Zagreb+Airport');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto pt-24 md:pt-28">
        <section className="max-w-4xl mx-auto w-full px-6 md:px-12 py-12 md:py-16 border-b border-black/10">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/40 mb-2">Parking</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 break-words">
              Book Your Parking Spot at Zagreb Airport
            </h1>
            <p className="text-sm md:text-base text-black/60">
              Guaranteed parking. Instant booking. Save up to 70%.
            </p>
          </div>
          <button onClick={handleBookNow} className="bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-black/90 transition inline-flex items-center gap-2">
            Book Now <ArrowRight size={18} />
          </button>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 border-b border-black/10">
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">Why Choose PayParq?</h2>
          <div className="space-y-6">
            {[
              { title: 'Guaranteed Parking Spot', desc: 'Your space is reserved and waiting. No searching, no disappointment.' },
              { title: 'Book in 2 Minutes', desc: 'Fast, simple booking process with instant confirmation.' },
              { title: 'Save Up to 70%', desc: 'Much cheaper than airport parking with guaranteed quality.' },
            ].map(b => (
              <div key={b.title} className="flex gap-4">
                <Check size={24} className="text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">{b.title}</h3>
                  <p className="text-sm text-black/60">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 border-b border-black/10">
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">How It Works</h2>
          <div className="space-y-6">
            [
              { num: 1, title: 'Search', desc: 'Find available parking near Zagreb Airport' },
              { num: 2, title: 'Book', desc: 'Select your spot and confirm instantly' },
              { num: 3, title: 'Get Your Parking Pass', desc: 'Receive your parking pass immediately after booking' },
              { num: 4, title: 'Show Your Pass', desc: 'Display your parking pass at the entrance' },
            ].map(step => (
              <div key={step.num} className="flex gap-4">
                <div className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-semibold">{step.num}</div>
                <div>
                  <h3 className="font-semibold text-black">{step.title}</h3>
                  <p className="text-sm text-black/60 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 border-b border-black/10">
          <h2 className="text-2xl font-semibold tracking-tight text-black mb-8">Trusted by Travelers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div><p className="text-3xl font-semibold text-black">50,000+</p><p className="text-sm text-black/60 mt-2">Happy travelers trust PayParq</p></div>
            <div><p className="text-3xl font-semibold text-black">365</p><p className="text-sm text-black/60 mt-2">Days of customer support available</p></div>
            <div><p className="text-3xl font-semibold text-black">100%</p><p className="text-sm text-black/60 mt-2">Satisfaction guaranteed or full refund</p></div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
          <div className="border border-black/10 rounded-xl p-8 md:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-black mb-4">Ready to Book?</h2>
            <p className="text-base text-black/60 mb-6">Save up to 70% on parking at Zagreb Airport. Book your guaranteed spot in 2 minutes.</p>
            <button onClick={handleBookNow} className="bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-black/90 transition inline-flex items-center gap-2">
              Book Now <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>
      <footer className="bg-[#05020A] px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto"><FooterBrand /></div>
      </footer>
    </div>
  );
}
