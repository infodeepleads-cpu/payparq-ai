'use client';

import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";

export default function Technology() {

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="relative overflow-hidden bg-[#05020A] text-white">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/316093/pexels-photo-316093.jpeg?auto=compress&cs=tinysrgb&w=1920')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-[#05020A]" />
          </div>
          <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 grid gap-10 md:grid-cols-[1.15fr,0.85fr] items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-4">
                Technology
              </p>
              <h1 className="text-3xl md:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5">
                The Mobile LPR engine behind modern parking.
              </h1>
              <p className="text-sm md:text-base text-white/80 mb-6 max-w-xl">
                Payparq combines Mobile License Plate Recognition with AI Computer Vision to turn every
                space, curb, and garage into a live digital asset. One cloud platform powers payments,
                enforcement, and analytics across cities and portfolios.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/discover-how" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                  <span>Talk to Sales</span>
                </Link>
                <Link href="/product" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors">
                  <span>Product &amp; Pricing</span>
                </Link>
              </div>
            </div>
            <div className="grid gap-4 text-xs md:text-sm text-white/80">
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">
                  Mobile LPR first
                </p>
                <p>
                  High-accuracy plate recognition from vehicles on the move, built for dense European
                  streets and mixed-use assets.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">
                  Space digitization
                </p>
                <p>
                  Every bay, curb, and zone mapped into a single geospatial layer that updates with every
                  drive-by.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">
                  Cloud-native control
                </p>
                <p>
                  Portfolio-wide configuration, enforcement, and pricing rules managed from one dashboard
                  instead of hardwired hardware.
                </p>
              </div>
            </div>
          </div>
        </section>

        

        

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.5fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Built for operators and cities
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                Technology that treats parking as a digital asset.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-5">
                With Payparq, every space gains a digital identity. Operators get a unified platform for
                Mobile LPR, pricing, and enforcement. Cities gain a live view of how curb and garage
                space is used across districts.
              </p>
              <div className="grid gap-4 text-xs md:text-sm text-black/80 md:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Portfolio uplift
                  </p>
                  <p>Protect revenue, reduce leakage, and drive higher NOI across every asset.</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Driver experience
                  </p>
                  <p>Frictionless access that makes parking disappear into the background of the journey.</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Compliance
                  </p>
                  <p>Real-time enforcement and clear audit trails for every captured event.</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Expansion
                  </p>
                  <p>Clone successful playbooks across new cities, countries, and portfolios.</p>
                </div>
              </div>
            </div>
            <div className="h-56 md:h-72 rounded-3xl overflow-hidden border border-black/5 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.3fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Talk to Sales
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Ready to modernize your parking technology stack?
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-6">
                  Share a few details about your portfolio and our team will outline how Mobile LPR and
                  AI Computer Vision can digitize your spaces, reduce costs, and unlock new revenue.
                </p>
                <div className="grid gap-4 text-xs md:text-sm text-white/80">
                  <div>
                    <p className="font-semibold mb-1">Zero CapEx deployment</p>
                    <p>Go live without installing heavy hardware or kiosks across your sites.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Global-ready architecture</p>
                    <p>Operate in one city or many with the same Mobile LPR and enforcement stack.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Measurable outcomes</p>
                    <p>Track occupancy, revenue, and compliance uplift from a single dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/5 p-6 flex items-center justify-center">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  Discover How
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
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
                Experience
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
          <div className="mt-12 pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
        </div>
      </footer>
    </div>
  );
}
