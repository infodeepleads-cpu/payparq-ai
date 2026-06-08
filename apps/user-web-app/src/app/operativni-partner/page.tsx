'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { useLocale } from '@/components/LocaleProvider';

const COUNTRIES = [
  { code: 'HR', name: 'Hrvatska', flag: '🇭🇷', phone: '+385' },
  { code: 'HU', name: 'Mađarska', flag: '🇭🇺', phone: '+36' },
  { code: 'SI', name: 'Slovenija', flag: '🇸🇮', phone: '+386' },
  { code: 'RS', name: 'Srbija', flag: '🇷🇸', phone: '+381' },
  { code: 'BA', name: 'Bosna i Hercegovina', flag: '🇧🇦', phone: '+387' },
  { code: 'AT', name: 'Austrija', flag: '🇦🇹', phone: '+43' },
  { code: 'IT', name: 'Italija', flag: '🇮🇹', phone: '+39' },
  { code: 'DE', name: 'Njemačka', flag: '🇩🇪', phone: '+49' },
  { code: 'SK', name: 'Slovačka', flag: '🇸🇰', phone: '+421' },
];

export default function OperativniPartner() {
  const { locale } = useLocale();
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyCountry, setCompanyCountry] = useState('HR');
  const [contactPerson, setContactPerson] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const registerForm = document.getElementById('register-form');
      if (registerForm) {
        const formBottom = registerForm.getBoundingClientRect().bottom;
        setShowStickyCta(formBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !companyEmail || !companyPhone || !contactPerson || !experienceLevel) {
      setSubmitMessage({ type: 'error', text: 'Molimo popunite sva polja' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: companyEmail,
          phone: companyPhone,
          country: companyCountry,
          companyName,
          contactPerson,
          experienceLevel,
          type: 'operative_partner',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registracija neuspješna');
      }

      setSubmitMessage({ type: 'success', text: 'Hvala! Kontaktirat ćemo vas u sljedećih 72h vezano uz vašu registraciju kao operativni partner.' });
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Nešto je pošlo naopako. Molimo pokušajte ponovo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'Što je partner',
      a: 'Partner je poduzeće ili osoba koja surađuje s PayParqom u upravljanju parkirnih mjesta.',
    },
    {
      q: 'Što radi Payparq operativni partner?',
      a: 'Operativni partner upravlja parkirnim mjestima u ime vlasnika - preuzima sve operativne obaveze i odgovore.',
    },
    {
      q: 'Koji su zahtjevi za partnerstvo?',
      a: 'Trebate biti registrirani kao poduzeće s iskustvom u upravljanju parkirnih mjesta ili sličnim uslugama.',
    },
    {
      q: 'Kako se određuje naknada?',
      a: 'Naknada se određuje na osnovu broja mjesta, lokacije i vremenskog horizonta. Razgovarajmo s našom prodajnom timom za detaljne uvjete.',
    },
    {
      q: 'Trebam li vlastite sustave?',
      a: 'Ne, korištite PayParq platformu i sve naše alate. Osiguravamo sve potrebne tehnologije.',
    },
    {
      q: 'Koji su teritorijalni zahtjevi?',
      a: 'Možete upravljati mjestima na većem teritoriju. Razmotrimo vašu dostupnost i kapacitete.',
    },
  ];

  return (
    <div className="min-h-screen text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 md:pt-56 md:pb-40" style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2000&h=1200&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'auto',
        }}>
          <div className="relative max-w-6xl mx-auto px-4 md:px-12">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-1 md:gap-12 items-center justify-center px-4 md:px-0">
              <div className="flex justify-center md:justify-end md:order-2 md:col-span-1 order-1 w-full md:w-auto md:mr-[-60px] md:mt-[-90px]">
                <form id="register-form" onSubmit={handleRegisterSubmit} className="rounded-2xl bg-white px-6 md:px-8 pt-14 md:pt-10 pb-10 md:pb-12 shadow-lg flex flex-col justify-start w-full max-w-sm md:max-w-md">
                  <h3 className="text-3xl font-bold text-black mb-6">Postani PayParq Operativni Partner</h3>

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-0.5 block">Naziv tvrtke</label>
                        <input
                          type="text"
                          placeholder="Vaš naziv tvrtke"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-0.5 block">Osoba za kontakt</label>
                        <input
                          type="text"
                          placeholder="Ime i prezime"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-0.5 block">E-pošta</label>
                      <input
                        type="email"
                        placeholder="Upišite vašu email adresu"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-1.5 block">Pozivni broj</label>
                        <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black flex items-center gap-1.5">
                          <span>{COUNTRIES.find(c => c.code === companyCountry)?.flag}</span>
                          <span className="font-semibold">{COUNTRIES.find(c => c.code === companyCountry)?.phone}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-black/80 mb-1.5 block">Broj mobilnog telefona</label>
                        <input
                          type="tel"
                          placeholder="1 234 5678"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black text-left focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-1 block">Država</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none" />
                        <select
                          value={companyCountry}
                          onChange={(e) => setCompanyCountry(e.target.value)}
                          className="w-full px-3 py-2 pl-9 bg-gray-100 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-black focus:text-black transition-colors appearance-none cursor-pointer text-black"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem',
                          }}
                        >
                          <option value="" disabled className="text-black/40">Odaberite državu</option>
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code} className="text-black">
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-1 block">Iskustvo</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-black focus:text-black transition-colors appearance-none cursor-pointer text-black"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        <option value="" disabled className="text-black/40">Odaberite razinu iskustva</option>
                        <option value="beginner" className="text-black">Početnik</option>
                        <option value="intermediate" className="text-black">Srednji nivo</option>
                        <option value="experienced" className="text-black">Iskusan</option>
                      </select>
                    </div>

                    <div className="flex items-start gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="terms"
                        className="w-4 h-4 rounded border-black/20 mt-0.5 cursor-pointer accent-black"
                      />
                      <label htmlFor="terms" className="text-xs text-black/70 cursor-pointer leading-tight">
                        Registracijom se slažete s našim <span className="font-semibold text-black hover:text-black/70 underline">Uvjetima korištenja</span> i <span className="font-semibold text-black hover:text-black/70 underline">Politikom privatnosti</span>
                      </label>
                    </div>

                    {submitMessage && (
                      <div className={`p-4 rounded-xl text-sm text-center font-semibold ${
                        submitMessage.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {submitMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-3 bg-black text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Registracija...' : 'Registriraj se sada'}
                    </button>

                    <div className="text-center pt-2 space-y-1">
                      <p className="text-xs text-black/70">Već imate račun?</p>
                      <Link href="/members" className="text-xs font-semibold text-black hover:text-black/70 transition-colors inline-block">
                        Prijavite se
                      </Link>
                    </div>
                  </div>
                </form>
              </div>

              <div className="md:order-1 md:col-span-1 order-2 md:mt-[-2cm]" style={{ marginTop: '0' }}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-white">
                  Vlasnik si parking tvrtke?
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8" style={{ marginTop: '0.5cm' }}>
                  Postanite PayParq operativni partner i zarađujte upravljajući parkirnim mjestima u vašoj regiji.
                </p>
              </div>
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
                      className={`w-5 h-5 text-black flex-shrink-0 ml-4 transition-transform ${
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
        <section className="relative py-16 md:py-20">
          <div className="absolute inset-0 bg-white"></div>
          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-black mb-4">
              Spremni za partnerstvo?
            </h2>
            <p className="text-base text-black/70 mb-8 max-w-2xl mx-auto">
              Pridružite se PayParq operativnim partnerima i zarađujte upravljajući parkirnim mjestima.
            </p>
            <a
              href="#register-form"
              onClick={(e) => {
                e.preventDefault();
                document.documentElement.scrollTop = 0;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <span>Postani partner</span>
              <span className="text-lg">→</span>
            </a>
          </div>
        </section>

        {/* Other Partner Programs */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-2">
              {locale === 'en' ? 'OTHER OPPORTUNITIES' : 'OSTALE MOGUĆNOSTI'}
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12">
              {locale === 'en' ? 'More ways to earn with PayParq' : 'Više načina za zaradu s PayParqom'}
            </h2>

            <div className="space-y-0">
              <Link href="/rent-a-car-partner" className="group flex items-center justify-between border-b border-white/10 py-6 hover:bg-white/5 -mx-6 px-6 transition-colors">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {locale === 'en' ? 'Rent a Car Partner' : 'Partner za Iznajmljivanje Automobila'}
                  </h3>
                  <p className="text-sm text-white/50">
                    {locale === 'en'
                      ? 'Offer PayParq parking to your rental customers and earn 10% referral bonus'
                      : 'Ponudite PayParq parking svojim kupcima i zarađujte 10% provizije'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-6" />
              </Link>

              <Link href="/hotel-partner" className="group flex items-center justify-between border-b border-white/10 py-6 hover:bg-white/5 -mx-6 px-6 transition-colors">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {locale === 'en' ? 'Hotels & Airbnb Partner' : 'Partner za Hotele i Airbnb'}
                  </h3>
                  <p className="text-sm text-white/50">
                    {locale === 'en'
                      ? 'Earn 10% referral bonus and optionally list your own parking'
                      : 'Zarađujte 10% provizije i opcionalno ponudite vlastiti parking prostor'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-6" />
              </Link>
            </div>
          </div>
        </section>

        {/* Video Demo Widget */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <a
              href="https://youtube.com/shorts/v4YZUGukrt4?is=QYigCArFSwNEkXOo"
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative bg-black rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="relative pt-[56.25%] bg-gradient-to-br from-gray-800 to-black">
                <img
                  src="https://img.youtube.com/vi/v4YZUGukrt4/maxresdefault.jpg"
                  alt="PayParq Demo"
                  className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-l-8 border-l-transparent border-r-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-l-black ml-1" style={{ borderLeft: '10px solid transparent', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: 'none', marginLeft: '2px' }}>
                      ▶
                    </div>
                  </div>
                  <p className="text-white text-lg font-semibold mt-4">Vidite kako radi</p>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* Footer */}
        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  Sigurno parkiranje za moderni svijet
                </h2>
                <p className="text-sm text-white/70">
                  PayParq povezuje vlasnike parkirnih mjesta s provjerenima vozačima za bez problema urbanu mobilnost.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Poduzeće
                  </p>
                  <Link href="/about" className="block hover:text-white transition-colors">
                    O nama
                  </Link>
                  <Link href="/careers" className="block hover:text-white transition-colors">
                    Karijera
                  </Link>
                  <Link href="/news" className="block hover:text-white transition-colors">
                    Vijesti
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Vizija
                  </p>
                  <Link href="/product" className="block hover:text-white transition-colors">
                    Proizvod
                  </Link>
                  <Link href="/parking" className="block hover:text-white transition-colors">
                    Parkiranje
                  </Link>
                  <Link href="/security" className="block hover:text-white transition-colors">
                    Sigurnost
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Politike
                  </p>
                  <Link href="/legal" className="block hover:text-white transition-colors">
                    Pravna
                  </Link>
                  <Link href="/privacy" className="block hover:text-white transition-colors">
                    Privatnost
                  </Link>
                  <Link href="/terms" className="block hover:text-white transition-colors">
                    Uvjeti
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Platforma
                  </p>
                  <Link href="/locations" className="block hover:text-white transition-colors">
                    Lokacije
                  </Link>
                  <Link href="/members" className="block hover:text-white transition-colors">
                    Članovi
                  </Link>
                  <Link href="/support" className="block hover:text-white transition-colors">
                    Podrška
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
              <h3 className="text-lg font-bold text-black">Spremni za partnerstvo?</h3>
              <p className="text-sm text-black/70">Registrirajte se kao operativni partner i započnite zaradu</p>
            </div>
            <a
              href="#register-form"
              onClick={(e) => {
                e.preventDefault();
                document.documentElement.scrollTop = 0;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-semibold hover:shadow-xl transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Registriraj se</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
