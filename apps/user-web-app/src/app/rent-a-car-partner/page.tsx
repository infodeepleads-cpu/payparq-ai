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

export default function RentACarPartner() {
  const { locale } = useLocale();
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyCountry, setCompanyCountry] = useState('HR');
  const [contactPerson, setContactPerson] = useState('');
  const [numLocations, setNumLocations] = useState('');
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

    if (!companyName || !companyEmail || !companyPhone || !contactPerson || !numLocations) {
      setSubmitMessage({
        type: 'error',
        text: locale === 'en' ? 'Please fill all fields' : 'Molimo popunite sva polja'
      });
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
          numLocations,
          type: 'rent_a_car_partner',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (locale === 'en' ? 'Registration failed' : 'Registracija neuspješna'));
      }

      setSubmitMessage({
        type: 'success',
        text: locale === 'en'
          ? 'Thank you! We will contact you within 72 hours.'
          : 'Hvala! Kontaktirat ćemo vas u sljedećih 72h vezano uz vašu registraciju.'
      });
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : (locale === 'en' ? 'Something went wrong. Please try again.' : 'Nešto je pošlo naopako. Molimo pokušajte ponovo.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: locale === 'en' ? 'How does the referral program work?' : 'Kako funkcionira referralni program?',
      a: locale === 'en'
        ? 'Your customers get a 10% discount code for PayParq parking. When they book parking, you earn a 10% referral bonus automatically.'
        : 'Vaši kupci dobijaju kod za 10% popust na PayParq parking. Kada parkuju, vi automatski zarađujete 10% provizije.',
    },
    {
      q: locale === 'en' ? 'How do we communicate the discount to customers?' : 'Kako komuniciramo popust kupcima?',
      a: locale === 'en'
        ? 'We provide marketing materials and discount codes. You can include them in booking confirmations, emails, and rental documentation.'
        : 'Pružamo vam marketing materijale i kodove. Možete ih uključiti u potvrde rezervacija, email i dokumentaciju iznajmljivanja.',
    },
    {
      q: locale === 'en' ? 'When do we receive payouts?' : 'Kada dobivamo isplate?',
      a: locale === 'en'
        ? 'Referral bonuses are calculated and paid monthly, based on bookings made with your customer codes.'
        : 'Provizije se obračunavaju i isplaćuju mjesečno, na osnovu rezervacija napravljenih s vašim kodovima.',
    },
    {
      q: locale === 'en' ? 'Do we need to integrate our system?' : 'Trebamo li integrirati naš sustav?',
      a: locale === 'en'
        ? 'No integration required. Simply share the discount codes with your customers through your existing channels.'
        : 'Nije potrebna integracija. Jednostavno podijelite kodove kupcima kroz vaše postojeće kanale.',
    },
    {
      q: locale === 'en' ? 'Which cities are covered?' : 'Koje gradove pokrivamo?',
      a: locale === 'en'
        ? 'PayParq operates in major cities across Central Europe. Check our coverage map for your region.'
        : 'PayParq djeluje u većim gradovima diljem Srednje Europe. Provjerite našu mapu dostupnosti za vašu regiju.',
    },
    {
      q: locale === 'en' ? 'What support do we get?' : 'Kakvu podršku dobivamo?',
      a: locale === 'en'
        ? 'Dedicated support team, marketing materials, regular performance reports, and partnership management.'
        : 'Namenski tim podrške, marketing materijale, redovne izvještaje o performansama i upravljanje partnerstvom.',
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
                  <h3 className="text-3xl font-bold text-black mb-6">
                    {locale === 'en' ? 'Become a PayParq Referral Partner' : 'Postani PayParq Referralni Partner'}
                  </h3>

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-0.5 block">
                          {locale === 'en' ? 'Company name' : 'Naziv tvrtke'}
                        </label>
                        <input
                          type="text"
                          placeholder={locale === 'en' ? 'Your company name' : 'Vaš naziv tvrtke'}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-0.5 block">
                          {locale === 'en' ? 'Contact person' : 'Osoba za kontakt'}
                        </label>
                        <input
                          type="text"
                          placeholder={locale === 'en' ? 'Name and surname' : 'Ime i prezime'}
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-0.5 block">
                        {locale === 'en' ? 'Email' : 'E-pošta'}
                      </label>
                      <input
                        type="email"
                        placeholder={locale === 'en' ? 'Enter your email' : 'Upišite vašu email adresu'}
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-black/80 mb-1.5 block">
                          {locale === 'en' ? 'Phone code' : 'Pozivni broj'}
                        </label>
                        <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black flex items-center gap-1.5">
                          <span>{COUNTRIES.find(c => c.code === companyCountry)?.flag}</span>
                          <span className="font-semibold">{COUNTRIES.find(c => c.code === companyCountry)?.phone}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-black/80 mb-1.5 block">
                          {locale === 'en' ? 'Phone number' : 'Broj mobilnog telefona'}
                        </label>
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
                      <label className="text-xs font-semibold text-black/80 mb-1 block">
                        {locale === 'en' ? 'Country' : 'Država'}
                      </label>
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
                          <option value="" disabled className="text-black/40">
                            {locale === 'en' ? 'Select country' : 'Odaberite državu'}
                          </option>
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code} className="text-black">
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black/80 mb-1 block">
                        {locale === 'en' ? 'Number of locations' : 'Broj lokacija'}
                      </label>
                      <input
                        type="number"
                        placeholder={locale === 'en' ? 'e.g., 5' : 'npr., 5'}
                        value={numLocations}
                        onChange={(e) => setNumLocations(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-black focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="terms"
                        className="w-4 h-4 rounded border-black/20 mt-0.5 cursor-pointer accent-black"
                      />
                      <label htmlFor="terms" className="text-xs text-black/70 cursor-pointer leading-tight">
                        {locale === 'en'
                          ? 'By registering, you agree to our '
                          : 'Registracijom se slažete s našim '}
                        <span className="font-semibold text-black hover:text-black/70 underline">
                          {locale === 'en' ? 'Terms of Use' : 'Uvjetima korištenja'}
                        </span>
                        {locale === 'en' ? ' and ' : ' i '}
                        <span className="font-semibold text-black hover:text-black/70 underline">
                          {locale === 'en' ? 'Privacy Policy' : 'Politikom privatnosti'}
                        </span>
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
                      {isSubmitting
                        ? (locale === 'en' ? 'Registering...' : 'Registracija...')
                        : (locale === 'en' ? 'Register now' : 'Registriraj se sada')}
                    </button>

                    <div className="text-center pt-2 space-y-1">
                      <p className="text-xs text-black/70">
                        {locale === 'en' ? 'Already have an account?' : 'Već imate račun?'}
                      </p>
                      <Link href="/members" className="text-xs font-semibold text-black hover:text-black/70 transition-colors inline-block">
                        {locale === 'en' ? 'Sign in' : 'Prijavite se'}
                      </Link>
                    </div>
                  </div>
                </form>
              </div>

              <div className="md:order-1 md:col-span-1 order-2 md:mt-[-2cm]" style={{ marginTop: '0' }}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-white">
                  {locale === 'en' ? 'Run a car rental?' : 'Vodiš iznajmljivanje automobila?'}
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8" style={{ marginTop: '0.5cm' }}>
                  {locale === 'en'
                    ? 'Become a PayParq partner and earn 10% referral bonus for every customer parking.'
                    : 'Postani PayParq partner i zarađuj 10% provizije za svako parkiranje kupca.'}
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
              {locale === 'en' ? 'Frequently asked questions' : 'Često postavljena pitanja'}
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
              {locale === 'en' ? 'Ready to earn more?' : 'Spreman zaraditi više?'}
            </h2>
            <p className="text-base text-black/70 mb-8 max-w-2xl mx-auto">
              {locale === 'en'
                ? 'Join the PayParq referral program and offer parking discounts to your customers.'
                : 'Pridružite se PayParq referralnom programu i ponudite popuste na parkiranje.'}
            </p>
            <a
              href="#register-form"
              onClick={(e) => {
                e.preventDefault();
                document.documentElement.scrollTop = 0;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <span>{locale === 'en' ? 'Become partner' : 'Postani partner'}</span>
              <span className="text-lg">→</span>
            </a>
          </div>
        </section>

        {/* Other Partner Programs */}
        <section className="py-16 md:py-20" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1054 40%, #0f0a2e 100%)' }}>
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-violet-300/70 mb-2">
              {locale === 'en' ? 'OTHER OPPORTUNITIES' : 'OSTALE MOGUĆNOSTI'}
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12">
              {locale === 'en' ? 'More ways to earn with PayParq' : 'Više načina za zaradu s PayParqom'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Operativni Partner */}
              <Link href="/operativni-partner" className="group p-8 rounded-2xl border border-white/10 hover:border-violet-400/50 hover:bg-white/5 transition-all duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {locale === 'en' ? '🅿️ Parking Operator' : '🅿️ Operativni Partner'}
                    </h3>
                    <p className="text-sm text-white/60">
                      {locale === 'en'
                        ? 'Manage parking spaces and earn from every booking'
                        : 'Upravljajte parkirnim mjestima i zarađujte od svake rezervacije'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-violet-300/80 mb-6 flex-1">
                    <span className="text-lg mt-0.5">✓</span>
                    <span>
                      {locale === 'en'
                        ? 'Full parking space management'
                        : 'Potpuno upravljanje parkirnim mjestima'}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:gap-3 transition-all">
                    <span>{locale === 'en' ? 'Learn more' : 'Saznaj više'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* Hotel Partner */}
              <Link href="/hotel-partner" className="group p-8 rounded-2xl border border-white/10 hover:border-violet-400/50 hover:bg-white/5 transition-all duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {locale === 'en' ? '🏨 Hotels & Airbnb' : '🏨 Hoteli i Airbnb'}
                    </h3>
                    <p className="text-sm text-white/60">
                      {locale === 'en'
                        ? 'Earn 10% referral bonus and optionally list your own parking'
                        : 'Zarađujte 10% provizije i opcionalno ponudite vlastiti parking prostor'}
                    </p>
                  </div>
                  <div className="space-y-2 flex-1 mb-6">
                    <div className="flex items-start gap-2 text-xs text-violet-300/80">
                      <span className="text-lg mt-0.5">✓</span>
                      <span>
                        {locale === 'en'
                          ? 'Your guests get 10% discount'
                          : 'Vaši gosti dobivaju 10% popust'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-violet-300/80">
                      <span className="text-lg mt-0.5">✓</span>
                      <span>
                        {locale === 'en'
                          ? 'List your own parking'
                          : 'Ponudite vlastiti parking prostor'}
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:gap-3 transition-all">
                    <span>{locale === 'en' ? 'Learn more' : 'Saznaj više'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  {locale === 'en' ? 'Safe parking for the modern world' : 'Sigurno parkiranje za moderni svijet'}
                </h2>
                <p className="text-sm text-white/70">
                  {locale === 'en'
                    ? 'PayParq connects parking space owners with verified drivers for hassle-free urban mobility.'
                    : 'PayParq povezuje vlasnike parkirnih mjesta s provjerenima vozačima za bez problema urbanu mobilnost.'}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    {locale === 'en' ? 'Company' : 'Poduzeće'}
                  </p>
                  <Link href="/about" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'About' : 'O nama'}
                  </Link>
                  <Link href="/careers" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Careers' : 'Karijera'}
                  </Link>
                  <Link href="/news" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'News' : 'Vijesti'}
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    {locale === 'en' ? 'Vision' : 'Vizija'}
                  </p>
                  <Link href="/product" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Product' : 'Proizvod'}
                  </Link>
                  <Link href="/parking" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Parking' : 'Parkiranje'}
                  </Link>
                  <Link href="/security" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Security' : 'Sigurnost'}
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    {locale === 'en' ? 'Policies' : 'Politike'}
                  </p>
                  <Link href="/legal" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Legal' : 'Pravna'}
                  </Link>
                  <Link href="/privacy" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Privacy' : 'Privatnost'}
                  </Link>
                  <Link href="/terms" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Terms' : 'Uvjeti'}
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    {locale === 'en' ? 'Platform' : 'Platforma'}
                  </p>
                  <Link href="/locations" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Locations' : 'Lokacije'}
                  </Link>
                  <Link href="/members" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Members' : 'Članovi'}
                  </Link>
                  <Link href="/support" className="block hover:text-white transition-colors">
                    {locale === 'en' ? 'Support' : 'Podrška'}
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
              <h3 className="text-lg font-bold text-black">
                {locale === 'en' ? 'Ready to become a partner?' : 'Spreman postati partner?'}
              </h3>
              <p className="text-sm text-black/70">
                {locale === 'en'
                  ? 'Register as a referral partner and start earning'
                  : 'Registrirajte se kao referralni partner i počnite zarađivati'}
              </p>
            </div>
            <a
              href="#register-form"
              onClick={(e) => {
                e.preventDefault();
                document.documentElement.scrollTop = 0;
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-semibold hover:shadow-xl transition-all whitespace-nowrap cursor-pointer"
            >
              <span>{locale === 'en' ? 'Register' : 'Registriraj se'}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
