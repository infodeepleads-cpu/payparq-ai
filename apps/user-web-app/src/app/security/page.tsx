"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FooterBrand } from "@/components/FooterBrand";

export const dynamic = "force-dynamic";

export default function Security() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none font-apple-ui">
        <div className="w-full px-4 md:px-10 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-8 text-[11px] font-medium text-black">
              <div className="flex items-center justify-start md:justify-center gap-4">
                <button
                  type="button"
                  className="md:hidden flex flex-col justify-center gap-[3px]"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  <span className="h-[1.5px] w-4 bg-black" />
                  <span className="h-[1.5px] w-4 bg-black" />
                </button>
                <div className="hidden md:flex items-center justify-center gap-7 text-[10px] uppercase tracking-[0.24em]">
                  <Link href="/experience" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setBusinessOpen((open) => !open);
                        setCompanyOpen(false);
                      }}
                    >
                      <span>Business</span>
                      <span className="text-[8px] leading-none">▾</span>
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/parking"
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setCompanyOpen((open) => !open);
                        setBusinessOpen(false);
                      }}
                    >
                      <span>Company</span>
                      <span className="text-[8px] leading-none">▾</span>
                    </button>
                  {companyOpen && (
                    <div className="absolute right-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[200px] z-50">
                      <Link
                        href="/about"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setCompanyOpen(false)}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setCompanyOpen(false)}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setCompanyOpen(false)}
                      >
                        News
                      </Link>
                      <Link
                        href="/contact"
                        className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setCompanyOpen(false)}
                      >
                        Get in touch
                      </Link>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Link href="/" className="relative flex items-center justify-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                      <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">
                        P
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-3">
                <Link
                  href="/contact"
                  className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get in Touch
                </Link>
                <Link
                  href="/pay"
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Pay Now
                </Link>
              </div>
            </div>
            {mobileOpen && (
              <div className="md:hidden border-t border-black/5 bg-white px-0 pb-3">
                <div className="flex flex-col gap-2 pt-2 text-[12px] font-medium text-black w-full max-w-xs mx-auto">
                  <Link
                    href="/experience"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Experience
                  </Link>
                  <button
                    className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setBusinessOpen((open) => !open);
                      setCompanyOpen(false);
                    }}
                  >
                    <span>Business</span>
                    <span className="text-[9px] leading-none">▾</span>
                  </button>
                  {businessOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/parking"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Parking
                      </Link>
                      <Link
                        href="/security"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Security
                      </Link>
                      <Link
                        href="/business"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/technology"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Technology
                  </Link>
                  <button
                    className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setCompanyOpen((open) => !open);
                      setBusinessOpen(false);
                    }}
                  >
                    <span>Company</span>
                    <span className="text-[9px] leading-none">▾</span>
                  </button>
                  {companyOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/about"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        News
                      </Link>
                      <Link
                        href="/contact"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Get in touch
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/contact"
                    className="w-full mt-2 border-t border-b border-gray-200 py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get in Touch
                  </Link>
                  <Link
                    href="/pay"
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Pay Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

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
