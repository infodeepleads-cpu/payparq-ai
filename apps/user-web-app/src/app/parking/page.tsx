'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Parking() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
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
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
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
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[200px] z-50">
                        <Link
                          href="/about"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          News
                        </Link>
                        <Link
                          href="/contact"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
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
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setBusinessOpen((open) => !open);
                      setCompanyOpen(false);
                    }}
                  >
                    <span>Business</span>
                    <ChevronDown className="w-3 h-3" />
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
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setCompanyOpen((open) => !open);
                      setBusinessOpen(false);
                    }}
                  >
                    <span>Company</span>
                    <ChevronDown className="w-3 h-3" />
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
            <div className="bg-black text-white text-[10px] md:text-[11px] text-center py-2 px-4 whitespace-nowrap">
              <span className="font-semibold">Payparq</span> secures parking portfolios across the Country{" "}
              <a
                href="https://www.poslovni.hr/hrvatska/startup-iz-dalmacije-osvaja-hrvatsku-zauvijek-cemo-promijeniti-nacin-parkiranja-4492394"
                target="_blank"
                rel="noreferrer"
              >
                – read more
              </a>
              .
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="relative overflow-hidden bg-[#05020A] text-white">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/4254550/pexels-photo-4254550.jpeg?auto=compress&cs=tinysrgb&w=1920')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05020A] via-[#05020A]/80 to-[#05020A]" />
          </div>
            <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-4">
                Smart upgrade
              </p>
              <h1 className="text-3xl md:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5">
                Parking, Reimagined.
              </h1>
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6">
                We digitize every space with Mobile LPR and AI Computer Vision to turn static lots into
                responsive digital assets. Delivering frictionless automated parking for drivers and
                real-time data for global partners.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  <span>Talk to Sales</span>
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors"
                >
                  <span>Product &amp; Pricing</span>
                </Link>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-[1.1fr,1.2fr] gap-8 items-start">
              <div className="text-xs md:text-sm text-white/80">
                <p className="font-semibold mb-2">
                  What if every parking space was a digital asset?
                </p>
                <p>
                  We bridge the gap between pavement and data, creating a real-time layer of intelligence
                  for every stall.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs md:text-sm">
                <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Global Space Digitization
                  </p>
                  <p className="text-white/80">
                    Every spot mapped and monitored via Mobile LPR, turning static inventory into live
                    digital capacity.
                  </p>
                </div>
                <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Frictionless Mobility
                  </p>
                  <p className="text-white/80">
                    Automated access and payments through AI Computer Vision deliver seamless, app-free
                    journeys.
                  </p>
                </div>
                <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Asset Optimization
                  </p>
                  <p className="text-white/80">
                    Turn static lots into high-yield, data-driven infrastructure with live performance
                    insight.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-xs md:text-sm text-white/70 max-w-xl">
              Our tech deploys instantly, digitizes globally, and automates everything.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 grid-cols-1 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Digitizing the World’s Parking Infrastructure
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                Digitizing the World’s Parking Infrastructure.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                We convert static pavement into live, monetizable infrastructure. Real-time visibility,
                automated operations, and data-backed control unlock higher NOI and frictionless mobility
                at scale.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black text-center">
                  Zero CapEx. Live in 3 Days.
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center max-w-4xl mx-auto text-xs md:text-sm text-black/80 mb-10">
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
                <p className="text-base md:text-lg font-semibold uppercase tracking-[0.16em] text-black">
                  Zero CapEx Infrastructure
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
                <p className="text-base md:text-lg font-semibold uppercase tracking-[0.16em] text-black">
                  Rapid Digital Onboarding
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
                <p className="text-base md:text-lg font-semibold uppercase tracking-[0.16em] text-black">
                  Built for Global Scale
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6" />
          </div>
        </section>
        

        

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 grid-cols-1 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                The Future of Smart Real Estate
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-white">
                “Digitizing our parking inventory was the turning point.”
              </h2>
              <p className="text-sm md:text-base text-white/80 mb-4">
                “Digitizing our parking inventory was the turning point. We stopped managing pavement and
                started managing a high-yield digital asset.”
              </p>
              <p className="text-xs md:text-sm text-white/60 mb-6">— Ivica, PayParq partner</p>
              <p className="text-sm md:text-base text-white/80 mb-4">
                “Payparq made our operations seamless and our customers happier.”
              </p>
              <p className="text-xs md:text-sm text-white/60">— Marko, PayParq partner</p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
              The Future of Parking
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
              The Future of Parking
            </h2>
            <div className="space-y-3 text-sm md:text-base text-black/80 max-w-3xl">
              <p>Parking is no longer space.</p>
              <p>It’s infrastructure.</p>
              <p>
                Metropolis proved it in the U.S.—the largest operator built not on leases or software,
                but on technology-driven operations.
              </p>
              <p>We bring even more. Live in 3 days. Properly informed and satisfied customers.</p>
              <p>No risk. No friction. No inefficiency.</p>
              <p>Just intelligent control, optimized revenue, and a permanent operating system.</p>
              <p>This isn’t parking.</p>
              <p>It’s mobility infrastructure.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#5F3DFC] shadow-md flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-7 h-7">
                    <circle cx="20" cy="32" r="7" fill="#ffffff" />
                    <circle cx="44" cy="32" r="7" fill="#ffffff" />
                    <circle cx="32" cy="32" r="5" fill="#ffffff" />
                    <path d="M28 42 L32 46 L36 42 Z" fill="#ffffff" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  PayParq HUBs
                </h2>
              </div>
              <p className="text-xs md:text-sm text-white/60 mb-4">Remote lots</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base text-white/80">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
                    Unbeatable Price Guarantee
                  </p>
                  <p>
                    We’ve cut the overhead—no shuttles, gates, or staff—to offer the market’s lowest
                    rates. Find a cheaper lot? We’ll refund the difference plus 50% off your next stay.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
                    Seamless Digital Entry
                  </p>
                  <p>
                    Skip the kiosks and apps. Our gateless, ticketless system uses plate recognition for
                    instant entry. Just drive in or reserve ahead for the best deal.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
                    Integrated Uber &amp; Taxi Hub
                  </p>
                  <p>
                    While our lot is remote, you’re never stranded. We feature dedicated Uber/Taxi
                    integration and 24/7 WhatsApp support to ensure a fast, reliable bridge to your final
                    destination.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
                    AI-Monitored Security
                  </p>
                  <p>
                    Rest easy with 24/7 AI Computer Vision monitoring every vehicle. We ensure all cars are
                    authorized and offer an optional insurance where applicable for total peace of mind.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#5F3DFC] text-white text-xs font-semibold shadow-md hover:bg-[#4330c4] transition-colors"
                >
                  Apply
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
