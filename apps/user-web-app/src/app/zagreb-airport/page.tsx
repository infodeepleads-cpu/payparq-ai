'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { AirportBookingFlow } from '@/components/AirportBookingFlow';
import { AirportReviews } from '@/components/AirportReviews';
import { AirportParkingLots } from '@/components/AirportParkingLots';
import { AirportSEOSection } from '@/components/AirportSEOSection';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { HowItWorks } from '@/components/HowItWorks';
import { WhyPayParq } from '@/components/WhyPayParq';
import { ArrowRight, Check } from 'lucide-react';

export default function ZagrebAirportPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const handleBookNow = () => {
    router.push('/search?lat=45.7429&lng=16.0688&name=Zagreb+Airport&source=airport');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto pt-24 md:pt-28">
        <section className="w-full px-6 md:px-12 py-12 md:py-20 border-b border-black/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 break-words">
                  {locale === 'hr' ? 'Parkiraj kod Aerodroma Zagreb' : 'Park at Zagreb Airport'}
                </h1>
                <p className="text-base text-black/70 mb-8 leading-relaxed">
                  {locale === 'hr'
                    ? 'Pronađite parking blizu Aerodroma Zagreb sa 150+ rezervabilnih mjesta. Zajamčeno mjesto po najboljoj cijeni. Rezervirajte u 2 minute s trenutnom potvrdom.'
                    : 'Find parking near Zagreb Airport with 150+ reservable spaces. Guaranteed spot at the best price. Book in 2 minutes with instant confirmation.'}
                </p>
                <div className="bg-white border border-black/10 rounded-xl p-6 shadow-sm">
                  <AirportBookingFlow defaultLat={45.7429} defaultLng={16.0688} defaultName="Zagreb Airport" />
                </div>
              </div>
              <div className="hidden md:flex h-[600px] rounded-xl overflow-hidden border border-black/10 shadow-sm">
                <div className="w-full bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=600&h=600&fit=crop")' }} />
              </div>
            </div>
          </div>
        </section>

        <AirportReviews airport="zagreb" locationName="Zagreb Airport" />

        <AirportParkingLots airport="zagreb" lat={45.7429} lng={16.0688} airportName="Zagreb Airport" />

        <AirportSEOSection location="zagreb" locationName="Zagreb Airport" city="Zagreb" region="Central Croatia" nearbyAreas={['Grad', 'Airport Area']} />

        <NearbyPlaces locationName="Zagreb Airport" locationKey="zagreb" />

        <HowItWorks airport="Zagreb Airport" />

        <WhyPayParq airport="Zagreb Airport" />

      </main>
      <footer className="bg-[#05020A] px-6 md:px-12 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">About</p>
              <Link href="/about" className="block hover:text-white transition-colors">About</Link>
              <Link href="/careers" className="block hover:text-white transition-colors">Careers</Link>
              <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Experience</p>
              <Link href="/product" className="block hover:text-white transition-colors">Product</Link>
              <Link href="/parking" className="block hover:text-white transition-colors">Parking</Link>
              <Link href="/security" className="block hover:text-white transition-colors">Security</Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
              <Link href="/legal" className="block hover:text-white transition-colors">Legal</Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="block hover:text-white transition-colors">Terms</Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
              <Link href="/locations" className="block hover:text-white transition-colors">Locations</Link>
              <Link href="/members" className="block hover:text-white transition-colors">Members</Link>
              <Link href="/support" className="block hover:text-white transition-colors">Support</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
        </div>
      </footer>
    </div>
  );
}
