'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

export default function Calculator() {
  const [spaces, setSpaces] = useState(1);
  const [days, setDays] = useState(5);
  const [price, setPrice] = useState<string>('8');

  const numericPrice = parseFloat(price) || 0;
  const monthlyEarnings = spaces * days * numericPrice * 4;

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-white pt-24 md:pt-28">
        {/* Hero Section with Calculator */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-[#5F3DFC]"></div>
          <div className="relative max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-4">
                  Earnings calculator
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 text-black">
                  How much could you earn?
                </h1>
                <p className="text-lg text-black/70 mb-8">
                  Use our earnings calculator to see how much you could earn without lifting a finger!
                </p>
                <div className="mt-8 space-y-2 text-sm">
                  <p className="text-black/60">
                    <span className="font-semibold text-[#5F3DFC]">Best locations</span> — up to €30/day
                  </p>
                  <p className="text-black/60">
                    <span className="font-semibold text-black">Mid locations</span> — up to €15/day
                  </p>
                  <p className="text-black/60">
                    <span className="font-semibold text-black/50">Other locations</span> — up to €8/day
                  </p>
                </div>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-72">
                  {/* Phone Frame */}
                  <div className="bg-black rounded-3xl p-3 shadow-2xl">
                    <div className="bg-white rounded-2xl p-6 space-y-6 h-[600px] overflow-y-auto">
                      {/* Phone Content */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-black text-center">Calculate earnings</h3>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-black">Spaces</label>
                            <span className="text-lg font-bold text-[#5F3DFC]">{spaces}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
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
                            <span className="text-sm text-black/50">€</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Enter price"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                          />
                          <p className="text-[10px] text-black/40 mt-1">
                            Best: €30/d · Mid: €15/d · Other: €8/d
                          </p>
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

                        <p className="text-[9px] text-black/40 leading-tight text-center mt-4">
                          *Estimate only. Actual earnings depend on location, demand, and availability. Payparq does not guarantee income.
                        </p>

                        <Link
                          href="/contact"
                          className="w-full bg-[#5F3DFC] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#4330c4] transition-colors text-center block"
                        >
                          List your space
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile View - Calculator without phone frame */}
        <section className="md:hidden bg-white py-16 px-6">
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-black text-center">Calculate earnings</h2>

            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-semibold text-black">Number of spaces</label>
                <span className="text-xl font-bold text-[#5F3DFC]">{spaces}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={spaces}
                onChange={(e) => setSpaces(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-semibold text-black">Days available per week</label>
                <span className="text-xl font-bold text-[#5F3DFC]">{days}</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black block mb-3">Price per day (€)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
              <p className="text-xs text-black/40 mt-2">
                Best: €30/d · Mid: €15/d · Other: €8/d
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center border border-black/10 mt-8">
              <p className="text-black/60 text-sm mb-2">Estimated monthly earnings</p>
              <p className="text-4xl font-bold text-[#5F3DFC] mb-3">
                €{monthlyEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-black/60 mb-4">
                {spaces} space{spaces !== 1 ? 's' : ''} • {days} day{days !== 1 ? 's' : ''}/week • €{price}/day
              </p>
              <p className="text-[10px] text-black/40 leading-tight mb-6">
                *Estimate only. Actual earnings depend on location, demand, and availability. Payparq does not guarantee income.
              </p>
              <Link
                href="/contact"
                className="block w-full bg-[#5F3DFC] text-white py-3 rounded-lg font-semibold hover:bg-[#4330c4] transition-colors"
              >
                List your parking space
              </Link>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
