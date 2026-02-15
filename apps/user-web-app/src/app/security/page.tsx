"use client";

import Link from "next/link";
import Image from "next/image";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default function Security() {

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Safe Parking
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                Stop unauthorized vehicles, keep trusted lists live.
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  <span>Talk to Sales</span>
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  <span>Product &amp; Pricing</span>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black p-4 md:p-6 text-white flex items-center justify-center">
              <Image
                src="/Snimka zaslona 2026-01-31 180550.png"
                alt="Safe parking with payparq"
                width={210}
                height={300}
                className="rounded-2xl border border-white/10 h-auto object-contain"
                priority
              />
            </div>
          </div>
        </section>
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16 md:pb-20">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Our partners
              </p>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4 text-black">
                Real-time space intelligence.
              </h1>
              <p className="text-sm md:text-base text-black/75">
                Digitize every stall with AI-powered recognition that keeps your parking assets safer,
                smarter, and always in view.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-14 md:py-18 grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                Security engine
              </p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
                Enterprise-ready digitization.
              </h2>
              <p className="text-sm md:text-base text-white/70">
                Go live in hours, not months. Whether you manage a single garage or a global portfolio,
                Payparq scales via Mobile LPR to protect and optimize every asset.
              </p>
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-3 text-xs md:text-sm text-white/80">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Advanced Mobile LPR
                </p>
                <p>
                  High-velocity License Plate Recognition delivers precise reads in dense, fast-moving
                  environments so no event is missed.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Real-world speed and auditing
                </p>
                <p>
                  Turn mobile captures into instant intelligence. Surface occupancy trends, unauthorized
                  vehicles, and VIP arrivals to act with confidence.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Enterprise-ready integration
                </p>
                <p>
                  Plug into your existing stack and digitize from one site to hundreds with the same
                  secure, cloud-first platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Our capabilities
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  Built for complex environments.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  The most demanding portfolios need real-time, contextual awareness. Payparq combines
                  Mobile LPR and behavioral signals to help teams see sooner, act faster, and protect what
                  matters.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs md:text-sm text-black/80">
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Space-level awareness
                  </p>
                  <p>
                    Stay aware of key vehicles and zones across your portfolio with continuous, accurate
                    recognition.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Contextual intelligence
                  </p>
                  <p>
                    Combine occupancy, dwell time, and behavior to understand risk and demand in real time.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Proactive analysis
                  </p>
                  <p>
                    Detect shifts before they become incidents with alerts on unusual movement or
                    enforcement gaps.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-1">
                    Effortless validation
                  </p>
                  <p>
                    Validate access instantly so only authorized vehicles enter premium zones or reserved
                    inventory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        

      </main>

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
              <button className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                Let&apos;s Talk
              </button>
              <Link
                href="/pay"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors"
              >
                Go to Pay Now
              </Link>
            </div>
          </div>
        </div>
      </section>

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
