'use client';

import { useParams } from 'next/navigation';
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
import { VENUES } from '@/data/venues';

export default function VenuePage() {
  const params = useParams();
  const { locale } = useLocale();
  const slug = params?.slug as string;
  const venue = VENUES[slug];

  if (!venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">{locale === 'hr' ? 'Lokacija nije pronađena' : 'Venue not found'}</h1>
          <Link href="/locations" className="text-blue-600 hover:underline">
            {locale === 'hr' ? 'Natrag na lokacije' : 'Back to locations'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto pt-24 md:pt-28">
        {/* Hero Section */}
        <section className="w-full px-6 md:px-12 py-12 md:py-20 border-b border-black/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 break-words">
                  {locale === 'hr' ? `Parkiranje blizu ${venue.name}` : `Parking near ${venue.name}`}
                </h1>

                <p className="text-base text-black/70 mb-8 leading-relaxed">
                  {locale === 'hr'
                    ? `Pronađite sigurno parkiranje blizu ${venue.name} s kapacitetom od ${venue.capacity.toLocaleString()} mjesta. Rezervirajte unaprijed za sve utakmice i događaje. Trenutna potvrda i zajamčene best cijene.`
                    : `Find secure parking near ${venue.name} with ${venue.capacity.toLocaleString()} capacity spaces. Book in advance for all matches and events. Instant confirmation and best prices guaranteed.`}
                </p>

                <div className="bg-white border border-black/10 rounded-xl p-6 shadow-sm">
                  <AirportBookingFlow defaultLat={venue.lat} defaultLng={venue.lng} defaultName={venue.name} showEvents={true} />
                </div>
              </div>

              <div className="hidden md:flex h-[600px] rounded-xl overflow-hidden border border-black/10 shadow-sm">
                <div
                  className="w-full bg-cover bg-center"
                  style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=600&h=600&fit=crop")',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <AirportReviews airport="split" locationName={venue.name} />

        {/* Parking Lots Section */}
        <AirportParkingLots airport="split" lat={venue.lat} lng={venue.lng} airportName={venue.name} />

        {/* SEO Section */}
        <AirportSEOSection
          location={slug}
          locationName={venue.name}
          city={venue.city}
          region="Events & Games"
          nearbyAreas={[`${venue.name} Area`, 'Parking']}
        />

        {/* Nearby Places Section */}
        <NearbyPlaces locationName={venue.name} locationKey={venue.id} />

        {/* How It Works + Why Choose PayParq */}
        <HowItWorks airport={venue.name} />
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
