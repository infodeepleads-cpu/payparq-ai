'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

const COUNTRIES = [
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', phone: '+385' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', phone: '+36' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', phone: '+386' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', phone: '+381' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦', phone: '+387' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', phone: '+43' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', phone: '+39' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', phone: '+421' },
];

export default function ListYourSpace() {
  const [spaces, setSpaces] = useState(1);
  const [days, setDays] = useState(5);
  const [price, setPrice] = useState(8);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hostEmail, setHostEmail] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [hostCountry, setHostCountry] = useState('HR');
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const registerForm = document.getElementById('register-form');
      if (registerForm) {
        const formBottom = registerForm.getBoundingClientRect().bottom;
        setShowStickyCta(formBottom < 0);
      }
    };

    // Handle anchor navigation
    const handleAnchor = () => {
      const hash = window.location.hash;
      if (hash === '#register-form') {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 50);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleAnchor);

    // Handle initial anchor if present
    handleAnchor();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleAnchor);
    };
  }, []);

  const monthlyEarnings = spaces * days * price * 4;

  const faqs = [
    {
      q: 'Da li je iznajmljivanje parkirnog mjesta legalno?',
      a: 'Iznajmljivanje parkirnog mjesta je potpuno legalno i sigurno. Preporučujemo da se informirate o lokalnim propisima jer mogu varirati po mjestu.',
    },
    {
      q: 'Trebam li dozvole ili registraciju?',
      a: 'Zahtjevi za dozvole i registraciju variraju ovisno o općini i mjestu. Molimo vas da se informirate kod nadležnog lokalnog tijela.',
    },
    {
      q: 'Kako se prijavljuje prihod od najma?',
      a: 'Prihod trebate prijaviti kao prihod od samostalne djelatnosti ili kao prihod od najma. Obratite se svojoj poreznoj upravi ili računovodstvenom stručnjaku za specifične upute.',
    },
    {
      q: 'Što ako ne želim sam upravljati parkirnim mjestom?',
      a: 'Možete koristiti naš operativni partneri sustav - pasivni (samo zarada) ili aktivni (potpuna uprava). Kontaktirajte nas za detalje.',
    },
    {
      q: 'Kada dobivam isplatu?',
      a: 'Sve uplate se isplaćuju na prvi radni dan sljedećeg mjeseca. Primjer: rezervacije iz siječnja plaćaju se u veljači.',
    },
    {
      q: 'Koji se načini plaćanja prihvaćaju?',
      a: 'Prihvaćamo bankove transfere i digitalne metode plaćanja. Upravljajte preferencama u svojoj host aplikaciji.',
    },
    {
      q: 'Jesu li naplaćene naknade?',
      a: 'Naplaćujemo uslužnu naknadu koju dodamo na Vašu cijenu kada vozač rezervira vaše mjesto. Nema skrivenih naknada ili troškova oglašavanja.',
    },
    {
      q: 'Je li moj novac siguran?',
      a: 'Da. Sva sredstva su osigurana i prebacuju se prema rasporedu. Koristimo industrijske standarde enkripcije.',
    },
  ];


  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-white pt-24 md:pt-28">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="absolute inset-0 bg-white md:bg-gradient-to-r md:from-white md:to-[#5F3DFC]"></div>
          <div className="relative max-w-6xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-12 items-center justify-center">
              <div className="flex justify-center md:justify-center md:order-2 md:col-span-1 order-1" style={{ marginTop: '-70px' }}>
                <div id="register-form" className="rounded-2xl bg-white border border-black/10 p-4 shadow-lg flex flex-col justify-start w-full max-w-sm">
                  <h3 className="text-lg font-bold text-black mb-3">Postani PayParq Host</h3>

                  <div className="space-y-2.5 flex-1 flex flex-col">
                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-0.5 block">Email</label>
                      <input
                        type="email"
                        placeholder="Upišite vašu email adresu"
                        value={hostEmail}
                        onChange={(e) => setHostEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#5F3DFC] focus:text-black transition-colors placeholder:text-black/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-1.5 block">Mobile</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-black/70 pointer-events-none">
                          {COUNTRIES.find(c => c.code === hostCountry)?.phone}
                        </div>
                        <input
                          type="tel"
                          placeholder="1 234 5678"
                          value={hostPhone}
                          onChange={(e) => setHostPhone(e.target.value)}
                          className="w-full px-4 py-2.5 pl-16 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-[#5F3DFC] transition-colors placeholder:text-black/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-1 block">Country</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none" />
                        <select
                          value={hostCountry}
                          onChange={(e) => setHostCountry(e.target.value)}
                          className="w-full px-3 py-2 pl-9 bg-gray-100 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#5F3DFC] focus:text-black transition-colors appearance-none cursor-pointer text-black"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem',
                          }}
                        >
                        <option value="" disabled className="text-black/40">Select country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code} className="text-black">
                            {country.name}
                          </option>
                        ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="terms"
                        className="w-4 h-4 rounded border-black/20 mt-0.5 cursor-pointer accent-[#5F3DFC]"
                      />
                      <label htmlFor="terms" className="text-xs text-black/70 cursor-pointer leading-tight">
                        By registering, you agree to our <span className="font-semibold text-[#5F3DFC] hover:underline">Terms of Service</span> and <span className="font-semibold text-[#5F3DFC] hover:underline">Privacy policy</span>
                      </label>
                    </div>

                    <p className="text-xs text-black/60 pt-1 leading-tight">
                      Once you've become a host, we will occasionally send you offers and promotions related to our services. You can always unsubscribe by changing your communication preferences.
                    </p>

                    <button className="w-full mt-3 bg-gradient-to-r from-[#5F3DFC] to-[#4330c4] text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-shadow text-sm">
                      Register Now
                    </button>

                    <div className="text-center pt-2 space-y-1">
                      <p className="text-xs text-black/70">Already have an account?</p>
                      <Link href="/members" className="text-xs font-semibold text-[#5F3DFC] hover:text-[#4330c4] transition-colors inline-block">
                        Prijavite se
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:order-1 md:col-span-1 order-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
                  <span className="text-[#5F3DFC]">Zarađujte rentajući parking mjesta</span> <span className="text-black">s Payparqom.</span>
                </h1>
                <p className="text-lg text-black/70 mb-8">
                  Become a Payparq host partner, set your schedule, and earn money renting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* List Your Space Form - Mobile Mockup */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-4">
                  List your space form
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                  How much could you earn?
                </h2>
                <p className="text-lg text-black/70 mb-8">
                  Use our earnings calculator to see how much you could earn without lifting a finger!
                </p>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5F3DFC] text-white text-sm font-semibold shadow-md hover:bg-[#4330c4] transition-colors"
                >
                  Calculate my earnings
                </Link>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-72">
                  {/* Phone Frame */}
                  <div className="bg-black rounded-3xl p-3 shadow-2xl">
                    <div className="bg-white rounded-2xl overflow-hidden h-[600px] flex flex-col">
                      {/* Phone Header */}
                      <div className="bg-black px-6 py-4 space-y-2 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center border border-white/40">
                            <span className="text-xs font-black tracking-tight text-white">P</span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white text-center">Kalkulator zarade</h3>
                      </div>
                      {/* Phone Content */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-black">Spaces</label>
                            <span className="text-lg font-bold text-[#5F3DFC]">{spaces}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={spaces}
                            onChange={(e) => setSpaces(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-black">Days/week</label>
                            <span className="text-lg font-bold text-[#5F3DFC]">{days}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="7"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-black">Price/day</label>
                            <span className="text-lg font-bold text-[#5F3DFC]">€{price}</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="50"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="bg-gradient-to-r from-[#5F3DFC]/10 to-[#5F3DFC]/5 rounded-xl p-4 text-center border border-[#5F3DFC]/20 mt-6">
                          <p className="text-xs text-black/60 mb-1">Monthly earnings</p>
                          <p className="text-3xl font-bold text-[#5F3DFC]">
                            €{monthlyEarnings.toLocaleString()}
                          </p>
                          <p className="text-xs text-black/50 mt-2">
                            {spaces}sp • {days}d/w • €{price}/d
                          </p>
                        </div>

                        <Link
                          href="/host"
                          className="w-full block bg-[#5F3DFC] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#4330c4] transition-colors cursor-pointer text-center"
                        >
                          Objavite svoje parkirno mjesto
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Booking Works */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-16 text-center">Kako funkcionira PayParq?</h2>

            <div className="space-y-12">
              {/* Step 1: Search */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-6xl font-black text-[#5F3DFC] mb-4">1</div>
                  <h3 className="text-4xl font-bold text-black mb-4">Search</h3>
                  <p className="text-lg text-black/70">Browse parking lots by location, view photos, check prices and availability.</p>
                </div>
                <div className="rounded-xl overflow-hidden h-64 md:h-80 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop"
                    alt="Search"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Step 2: Pay */}
              <div className="grid md:grid-cols-2 gap-8 items-center md:grid-flow-dense">
                <div className="rounded-xl overflow-hidden h-64 md:h-80 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=500&fit=crop"
                    alt="Pay"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-6xl font-black text-[#5F3DFC] mb-4">2</div>
                  <h3 className="text-4xl font-bold text-black mb-4">Plaćanje</h3>
                  <p className="text-lg text-black/70">Select your dates and times, complete secure payment via Stripe, and receive instant confirmation.</p>
                </div>
              </div>

              {/* Step 3: Pass */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-6xl font-black text-[#5F3DFC] mb-4">3</div>
                  <h3 className="text-4xl font-bold text-black mb-4">Propusnica</h3>
                  <p className="text-lg text-black/70">Receive your QR code parking pass via email, access entry codes in the app, and you're ready to park.</p>
                </div>
                <div className="rounded-xl overflow-hidden h-64 md:h-80 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=500&fit=crop"
                    alt="Pass"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* CTA Widget */}
            <div className="mt-16 text-center bg-gradient-to-r from-[#5F3DFC]/10 to-[#4330c4]/10 rounded-2xl p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">Ready to start earning?</h3>
              <p className="text-lg text-black/70 mb-8">Join thousands of hosts making money with Payparq</p>
              <a
                href="#register-form"
                onClick={(e) => {
                  e.preventDefault();
                  document.documentElement.scrollTop = 0;
                }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#5F3DFC] to-[#4330c4] text-white font-bold text-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <span>Počnite s rezervacijama odmah</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#F5F5F7] py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
              Kako do zarade?
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-black mb-12">
              Three simple steps to start earning
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Create your listing',
                  desc: 'Add your space details, set your price, and upload photos in minutes.',
                  image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
                  alt: 'Creating listing on phone'
                },
                {
                  step: '02',
                  title: 'Drivers book and park',
                  desc: 'Verified drivers find and book your space. You get notified instantly.',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                  alt: 'Happy driver booking'
                },
                {
                  step: '03',
                  title: 'You get paid',
                  desc: 'Earnings land in your account automatically. No chasing required.',
                  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop',
                  alt: 'Smiling person with money'
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-6">
                    <p className="text-4xl font-bold text-[#5F3DFC] mb-3">{item.step}</p>
                    <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                    <p className="text-sm text-black/70">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
              FAQ
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-black mb-12">
              Često postavljena pitanja
            </h2>

            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border-b border-black/10 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between mb-0">
                    <h3 className="text-base font-semibold text-black flex-1">
                      {faq.q}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-[#5F3DFC] flex-shrink-0 ml-4 transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {openFaq === i && (
                    <p className="text-sm text-black/70 mt-4">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section
          id="get-started"
          className="relative py-16 md:py-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-[#5F3DFC]"></div>
          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-black mb-4">
              Ready to start earning?
            </h2>
            <p className="text-base text-black/70 mb-8 max-w-2xl mx-auto">
              Join thousands of hosts earning passive income with Payparq.
            </p>
            <Link
              href="#register-form"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#5F3DFC] to-[#4330c4] text-white text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <span>List your parking space</span>
              <span className="text-lg">→</span>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  Secure parking for the modern world
                </h2>
                <p className="text-sm text-white/70">
                  Payparq connects parking space owners with verified drivers for frictionless urban mobility.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Company
                  </p>
                  <Link href="/about" className="block hover:text-white transition-colors">
                    About
                  </Link>
                  <Link href="/careers" className="block hover:text-white transition-colors">
                    Careers
                  </Link>
                  <Link href="/news" className="block hover:text-white transition-colors">
                    News
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Vision
                  </p>
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
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Policies
                  </p>
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
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Platform
                  </p>
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
            </div>
            <div className="pt-6 border-t border-white/10">
              <FooterBrand />
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 md:p-6 shadow-2xl z-50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-black">Ready to earn?</h3>
              <p className="text-sm text-black/70">List your parking space and start earning today</p>
            </div>
            <a
              href="#register-form"
              onClick={(e) => {
                e.preventDefault();
                document.documentElement.scrollTop = 0;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#5F3DFC] to-[#4330c4] text-white font-semibold hover:shadow-xl transition-all whitespace-nowrap cursor-pointer"
            >
              <span>List Now</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
