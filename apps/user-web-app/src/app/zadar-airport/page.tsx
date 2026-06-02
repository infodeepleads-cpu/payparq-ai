'use client';

import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { AirportBookingFlow } from '@/components/AirportBookingFlow';
import { ArrowRight, Check } from 'lucide-react';

export default function ZadarAirportPage() {
  const router = useRouter();

  const handleBookNow = () => {
    router.push('/search?lat=44.1083&lng=15.3467&name=Zadar+Airport&source=airport');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto pt-24 md:pt-28">
        <section className="w-full px-6 md:px-12 py-12 md:py-20 border-b border-black/10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40 mb-3">Parking Solutions</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black mb-4 break-words">
                Guaranteed Parking at Zadar Airport
              </h1>
              <p className="text-base md:text-lg text-black/70 mb-8 leading-relaxed">
                Book your parking spot in 2 minutes. Reserved space. Instant confirmation. Save up to 70% vs airport rates.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/80">Guaranteed reserved parking spot</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/80">Free cancellation up to 24 hours</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/80">Instant parking pass via email & SMS</span>
                </div>
              </div>
              <div className="md:hidden">
                <AirportBookingFlow defaultLat={44.1083} defaultLng={15.3467} defaultName="Zadar Airport" />
              </div>
            </div>
            <div className="hidden md:flex h-96 rounded-xl overflow-hidden border border-black/10 shadow-sm">
              <div className="w-full bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop")' }} />
            </div>
          </div>
          <div className="hidden md:flex max-w-6xl mx-auto mt-12 justify-center">
            <div className="w-full md:w-2/3 bg-gradient-to-r from-gray-50 to-white border border-black/10 rounded-xl p-6">
              <AirportBookingFlow defaultLat={44.1083} defaultLng={15.3467} defaultName="Zadar Airport" />
            </div>
          </div>
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
            {[
              { num: 1, title: 'Search', desc: 'Find available parking near Zadar Airport' },
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
            <p className="text-base text-black/60 mb-6">Save up to 70% on parking at Zadar Airport. Book your guaranteed spot in 2 minutes.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleBookNow} className="hidden md:inline-flex bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-black/90 transition items-center gap-2">
                Book Now <ArrowRight size={18} />
              </button>
              <AirportBookingFlow defaultLat={44.1083} defaultLng={15.3467} defaultName="Zadar Airport" />
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#05020A] px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto"><FooterBrand /></div>
      </footer>
    </div>
  );
}
