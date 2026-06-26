'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { AirportBookingFlow } from '@/components/AirportBookingFlow';
import { LocationSelectorModal } from '@/components/LocationSelectorModal';
import { AirportReviews } from '@/components/AirportReviews';
import { AirportParkingLots } from '@/components/AirportParkingLots';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { CityWhatYouShouldKnow } from '@/components/CityWhatYouShouldKnow';
import { SmarterWayToPark } from '@/components/SmarterWayToPark';
import { WhyPayParq } from '@/components/WhyPayParq';
import type { City } from '@/data/cities';

interface CityPageClientProps {
  city: City;
  slug: string;
}

export default function CityPageClient({ city, slug }: CityPageClientProps) {
  const { locale } = useLocale();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05020A] flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-16">
        {/* Hero Section */}
        <section className="w-full px-6 md:px-12 py-16 md:py-10 md:border-b md:border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="flex flex-col justify-center">
                {locale === 'hr' && slug === 'rovinj' ? (
                  <h1 className="text-4xl md:text-7xl font-semibold md:font-bold tracking-tight mb-2 md:mb-4 break-words text-white" style={{ lineHeight: '1.2' }}>
                    <span style={{ color: '#fff' }}>Usporedi cijene</span><br />
                    <span style={{ color: '#7c3aed' }}>parkinga u Rovinju</span>
                  </h1>
                ) : (
                  <h1 className="text-4xl md:text-7xl font-semibold md:font-bold tracking-tight mb-2 md:mb-4 break-words text-white" style={{ lineHeight: '1.2' }}>
                    {locale === 'hr' ? (
                      <>
                        <span style={{ color: '#fff' }}>Pronađite parking u</span><br />
                        <span style={{ color: '#7c3aed' }}>{city.locativeName || city.name}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#fff' }}>Find Parking in</span><br />
                        <span style={{ color: '#7c3aed' }}>{city.name}</span>
                      </>
                    )}
                  </h1>
                )}

                <div className="bg-white border border-white/10 rounded-xl p-6 shadow-sm">
                  <AirportBookingFlow
                    defaultLat={city.lat}
                    defaultLng={city.lng}
                    defaultName={city.name}
                    onLocationClick={() => setIsLocationModalOpen(true)}
                  />
                </div>
              </div>

              <div className="hidden md:flex rounded-xl overflow-hidden border border-white/10 shadow-sm md:mt-3" style={{ height: slug === 'rovinj' ? '600px' : '600px' }}>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop"
                  alt="Smiling lady"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section - Hidden on mobile */}
        <div className="hidden md:block">
          <AirportReviews airport={slug} locationName={city.name} />
        </div>

        {/* Parking Lots Section */}
        <AirportParkingLots airport={slug} lat={city.lat} lng={city.lng} airportName={city.name} />

        {/* Nearby Places Section */}
        <NearbyPlaces locationName={city.name} locationKey={slug} />

        {/* What You Should Know */}
        <CityWhatYouShouldKnow cityName={city.name} />

        {/* Smarter Way to Park */}
        <SmarterWayToPark />

        {/* Why PayParq */}
        <WhyPayParq airport={city.name} />
      </main>

      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentSlug={slug}
      />

      <footer className="bg-[#05020A] px-6 md:px-12 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">About</p>
              <Link href="/about" className="block hover:text-white transition-colors">
                About
              </Link>
              <Link href="/careers" className="block hover:text-white transition-colors">
                Careers
              </Link>
              <Link href="/contact" className="block hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Experience</p>
              <Link href="/product" className="block hover:text-white transition-colors">
                Product
              </Link>
              <Link href="/parking" className="block hover:text-white transition-colors">
                Parking
              </Link>
              <Link href="/security" className="block hover:text-white transition-colors">
                Security
              </Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
              <Link href="/legal" className="block hover:text-white transition-colors">
                Legal
              </Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="block hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            <div className="space-y-3 text-white/70 text-xs md:text-sm">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
              <Link href="/locations" className="block hover:text-white transition-colors">
                Locations
              </Link>
              <Link href="/members" className="block hover:text-white transition-colors">
                Members
              </Link>
              <Link href="/support" className="block hover:text-white transition-colors">
                Support
              </Link>
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
