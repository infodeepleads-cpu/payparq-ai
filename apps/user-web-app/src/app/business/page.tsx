'use client';

import Link from "next/link";
import Image from "next/image";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default function Business() {

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
                  "url('https://images.pexels.com/photos/373912/pexels-photo-373912.jpeg?auto=compress&cs=tinysrgb&w=1920')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05020A] via-[#05020A]/80 to-[#05020A]" />
          </div>
          <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-4">
                Smart City
              </p>
              <h1 className="text-3xl md:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5">
                Payparq transforms parking from static real estate into a responsive, software-led asset.
              </h1>
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6">
                A mobile, software-only platform that understands every space in real time, automates
                payments and enforcement, and unlocks new value across your portfolio.
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
            
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
              Smart Sign
            </p>
            <div className="border border-black/10 bg-[#05020A] p-4 md:p-6 text-white flex items-center justify-center">
              <Image
                src="/Untitled-2.png"
                alt="Smart City visualization"
                width={210}
                height={300}
                className="h-auto object-contain"
                priority
              />
            </div>
          </div>
        </section>
 
        <section className="bg-[#F5F5F7]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Software-first deployment
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-black">
                Live in days, not months.
              </h2>
              <p className="text-sm md:text-base text-black/75">
                Software-only deployments across complex urban assets.
              </p>
            </div>
            <div className="h-64 md:h-80 rounded-3xl overflow-hidden border border-black/5 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/681335/pexels-photo-681335.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          </div>
        </section>



        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 mb-10">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Proven across environments
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  One platform for curbside, garages, mixed-use, and municipal portfolios.
                </h2>
                <p className="text-sm md:text-base text-white/75">
                  Payparq adapts to the way each asset is used, while giving you a single source of
                  truth across every car park, on-street zone, and shared mobility hub.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Office &amp; mixed-use
                </p>
                <p className="text-white/80">
                  Serve commuters, visitors, and retail in one seamless, app-free experience.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Residential
                </p>
                <p className="text-white/80">
                  Protect resident bays while unlocking safe, flexible visitor and shared use.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Municipal
                </p>
                <p className="text-white/80">
                  Modernize on-street and off-street assets with real-time policy and pricing
                  control.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Destinations
                </p>
                <p className="text-white/80">
                  Elevate arrival at stadiums, venues, and tourist destinations with effortless
                  access.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-2 items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Dalmatian coast
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-black">
                  AI mobile LPR for Split, Makarska and Dubrovnik.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Summer peaks create chokepoints and overloaded car parks. Payparq brings mobile
                  license plate recognition and live dashboards so every scan and zone is visible in
                  real time.
                </p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-5 text-xs md:text-sm text-black/80">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
                  Park &amp; Taxi — Case Study: Brela
                </p>
                <p className="mb-2">
                  In Brela on the Makarska Riviera, captured up to 40 cars per day at chokepoints and routed them to remote lots for
                  faster arrivals and better capacity use.
                </p>
                <p>
                  A simple, software-only flow at busy junctions keeps traffic moving while
                  protecting resident bays and visitor zones.
                </p>
              </div>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3 text-sm md:text-base text-black/80">
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Split
                </p>
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Optimising parking operations in Split.
                </h3>
                <p className="mb-3 text-sm md:text-base">
                  Demand explodes around the ferry port, Poljud and the city centre. Payparq shows
                  which zones are full, where overstays happen and how patrols move during peak
                  hours.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs md:text-sm text-black/75">
                  <li>Better control of mixed resident and tourist parking near the centre.</li>
                  <li>
                    Faster enforcement around high-turnover areas like the Riva and ferry terminal.
                  </li>
                  <li>Clear reporting for city management and private operators.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Makarska
                </p>
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Handling seasonal peaks in Makarska.
                </h3>
                <p className="mb-3 text-sm md:text-base">
                  Streets and waterfront parking fill up quickly in summer, and every unpaid stay is
                  lost revenue. Payparq guides patrols along the promenade and side streets while the
                  dashboard shows live turnover across all locations.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs md:text-sm text-black/75">
                  <li>Targeted patrols where violations are actually happening.</li>
                  <li>Better protection of dedicated staff and resident parking.</li>
                  <li>Data to support seasonal pricing and expansion decisions.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Dubrovnik
                </p>
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Protecting capacity around Dubrovnik&apos;s Old Town.
                </h3>
                <p className="mb-3 text-sm md:text-base">
                  Old Town visitors, cruise passengers and limited street space make parking highly
                  sensitive. Payparq gives a clear picture of who is parked where, how long and with
                  which permission.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs md:text-sm text-black/75">
                  <li>More efficient control around key tourist hotspots and access roads.</li>
                  <li>Less abuse of permits and special parking rights.</li>
                  <li>Documented enforcement trail for every plate, photo and case.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        

        <section className="bg-[#05020A] text-white border-t border-white/10">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Ready to modernize
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Turn your parking portfolio into a connected, intelligent network.
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-4">
                  Payparq secures smarter parking portfolios across the Country. Our software-only
                  platform enables parking operators and cities to manage payments, enforcement, and
                  compliance in real time — without costly hardware.
                </p>
                <p className="text-sm md:text-base text-white/75">
                  Reduce operational costs, increase revenue, and deploy in days, not months.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  Let&apos;s Talk
                </Link>
                <Link
                  href="/pay"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors"
                >
                  Pay Now
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
              <button className="block hover:text-white transition-colors">Product</button>
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
              <button className="block hover:text-white transition-colors">Partners</button>
              <button className="block hover:text-white transition-colors">Support</button>
              <Link href="/members" className="block hover:text-white transition-colors">
                Members
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
