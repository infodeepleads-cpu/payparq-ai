'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

export default function ListYourSpace() {
  const [spaces, setSpaces] = useState(1);
  const [days, setDays] = useState(5);
  const [price, setPrice] = useState(8);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const monthlyEarnings = spaces * days * price * 4;

  const faqs = [
    {
      q: 'When do I get paid?',
      a: 'All rental payments are paid out on the first business day of the following month. For example, rent for completed bookings in January will be paid on the first business day in February.',
    },
    {
      q: 'What if I haven\'t added a payment preference?',
      a: 'If a payment preference has not been added, your funds will remain secure with Payparq until a payment option is added.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept bank transfers and digital payment methods. You can manage your payment preferences in your host dashboard.',
    },
    {
      q: 'Are there any fees?',
      a: 'We charge a small commission on earnings when a driver books your space. There are no hidden fees or listing costs.',
    },
    {
      q: 'Can I withdraw my earnings early?',
      a: 'Standard payouts are on the first business day of each month. Contact our support team for information about early withdrawal options.',
    },
    {
      q: 'How do I track my earnings?',
      a: 'Your host dashboard provides real-time earnings tracking, detailed booking history, and payment statements.',
    },
    {
      q: 'What if there\'s a dispute with a driver?',
      a: 'Our support team handles disputes professionally. We protect your interests and ensure fair resolution of any issues.',
    },
    {
      q: 'Is my money secure?',
      a: 'Yes. All funds are held securely and transferred to your registered payment method on schedule. We use industry-standard encryption.',
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
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                  <span className="text-[#5F3DFC]">Join thousands other space owners.</span> <span className="text-black text-2xl md:text-3xl">List today and start earning hundreds from your unused parking spaces</span>
                </h1>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5F3DFC] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-sm">✓</span>
                    </div>
                    <p className="text-base font-semibold text-black">100% free to list</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5F3DFC] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-sm">✓</span>
                    </div>
                    <p className="text-base font-semibold text-black">Verified drivers and vehicles</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5F3DFC] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-sm">✓</span>
                    </div>
                    <p className="text-base font-semibold text-black">Set your own prices</p>
                  </div>
                </div>
                <Link
                  href="/members?redirect=/list-your-parking"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#5F3DFC] to-[#4330c4] text-white text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <span>List your parking space</span>
                  <span className="text-lg">→</span>
                </Link>
              </div>

              <div className="hidden md:flex justify-center">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop"
                  alt="Smiling person"
                  className="rounded-2xl object-cover h-[500px] w-full"
                />
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
                      <div className="bg-black px-6 py-4 space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative w-9 h-9">
                            <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                            <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
                              <span className="text-xs font-black tracking-tight text-white">P</span>
                            </div>
                          </div>
                          <span className="text-sm font-black tracking-tight text-white">payparq</span>
                        </div>
                        <h3 className="text-lg font-bold text-white text-center">Calculate earnings</h3>
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

                        <button className="w-full bg-[#5F3DFC] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#4330c4] transition-colors">
                          List your space
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#F5F5F7] py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
              How it works
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
              Payment
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-black mb-12">
              How do I get paid?
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
              href="/members?redirect=/list-your-parking"
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
    </div>
  );
}
