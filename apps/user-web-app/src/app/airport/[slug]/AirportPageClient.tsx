'use client';

import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { AirportBookingFlow } from '@/components/AirportBookingFlow';
import { AirportReviews } from '@/components/AirportReviews';
import { AirportParkingLots } from '@/components/AirportParkingLots';
import { SmarterWayToPark } from '@/components/SmarterWayToPark';
import { AirportSEOSection } from '@/components/AirportSEOSection';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { WhyPayParq } from '@/components/WhyPayParq';
import type { Airport } from '@/data/airports';

interface AirportPageClientProps {
  airport: Airport;
  slug: string;
}

export default function AirportPageClient({ airport, slug }: AirportPageClientProps) {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-[#05020A] flex flex-col overflow-hidden">
      <SiteHeader />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-16">
        <section className="w-full px-6 md:px-12 py-16 md:py-10 md:border-b md:border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl md:text-7xl font-semibold md:font-bold tracking-tight mb-2 md:mb-4 break-words text-white" style={{ lineHeight: '1.2' }}>
                  {locale === 'hr' ? (
                    <>
                      <span style={{ color: '#fff' }}>Parkiraj kod</span><br />
                      <span style={{ color: '#2563eb' }}>{airport.name}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#fff' }}>Park at</span><br />
                      <span style={{ color: '#2563eb' }}>{airport.name}</span>
                    </>
                  )}
                </h1>

                <div className="bg-white border border-white/10 rounded-xl p-6 shadow-sm">
                  <AirportBookingFlow defaultLat={airport.lat} defaultLng={airport.lng} defaultName={airport.name} />
                </div>
              </div>

              <div className="hidden md:flex rounded-xl overflow-hidden border border-white/10 shadow-sm md:mt-3" style={{ height: '600px' }}>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop"
                  alt="Smiling lady"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <AirportReviews airport={slug} locationName={airport.name} />
        <AirportParkingLots airport={slug} lat={airport.lat} lng={airport.lng} airportName={airport.name} />
        <SmarterWayToPark />
        <AirportSEOSection
          location={slug}
          locationName={airport.name}
          city={airport.city}
          region={airport.region}
          nearbyAreas={airport.nearbyAreas}
        />
        <NearbyPlaces locationName={airport.name} locationKey={slug} />
        <WhyPayParq airport={airport.name} />
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
