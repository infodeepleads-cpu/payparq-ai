"use client";

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function About() {
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
                      onClick={() => setBusinessOpen((open) => !open)}
                    >
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
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
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => setCompanyOpen((open) => !open)}
                    >
                      <span>Company</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
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
                <button className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors">
                  Get in Touch
                </button>
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
                    onClick={() => setBusinessOpen((open) => !open)}
                  >
                    <span>Business</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {businessOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/business"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
                      <Link
                        href="/parking"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Parking
                      </Link>
                      <Link
                        href="/security"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Security
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
                    onClick={() => setCompanyOpen((open) => !open)}
                  >
                    <span>Company</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {companyOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/about"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        News
                      </Link>
                    </div>
                  )}
                  <button className="w-full mt-2 border-t border-b border-gray-200 py-3 text-center hover:bg-gray-100 transition-colors">
                    Get in Touch
                  </button>
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
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.4fr,1fr] items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Company
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5 text-black">
                Powering a more connected future of parking.
              </h1>
              <p className="text-sm md:text-base text-black/75 mb-5 max-w-xl">
                Payparq is building a software-only mobility platform that turns every space into a
                connected, data-driven asset. We use Mobile LPR, AI Computer Vision, and automation
                to make arrival effortless for drivers and operations simple for cities and operators.
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] md:text-xs text-black/70">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-black/5">
                  Software-only infrastructure
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-black/5">
                  Mobile LPR + AI Computer Vision
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-black/5">
                  Built for cities and operators
                </span>
              </div>
            </div>
            <div className="grid gap-4 text-xs md:text-sm text-black/80">
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                  What we do
                </p>
                <p>
                  We digitize physical parking spaces so they can be priced, managed, and experienced
                  like modern digital products.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-4 transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/60 mb-1">
                  Where we focus
                </p>
                <p className="text-white/80">
                  Mixed-use garages, on-street portfolios, campuses, destinations, and fast-growing
                  urban environments.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-2 items-start">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">
                Beliefs
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                We believe access should be invisible to the journey.
              </h2>
              <p className="text-sm md:text-base text-black/75">
                Parking should feel like the easiest part of moving through a city. No queues,
                confusion, or hardware-heavy gates—just seamless, app-free arrivals that work in
                the background.
              </p>
              <p className="text-sm md:text-base text-black/75">
                We design for drivers, operators, and cities at the same time, so every journey
                is simple, every asset performs, and every policy decision is grounded in live data.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">
                Vision
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                Turning physical infrastructure into a responsive digital layer.
              </h2>
              <p className="text-sm md:text-base text-black/75">
                Cities and portfolios are still run on analog systems and fragmented tools. Payparq
                brings them into a single software layer, where pricing, access, and enforcement
                respond in real time.
              </p>
              <p className="text-sm md:text-base text-black/75">
                By treating every bay as a live digital asset, we help partners unlock new revenue,
                reduce leakage, and deliver better experiences without rebuilding physical
                infrastructure.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1.2fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Team
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  A team built at the intersection of mobility, cities, and software.
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-4">
                  Payparq brings together engineers, operators, and city partners who have built
                  products and infrastructure across mobility, payments, and urban systems.
                </p>
                <p className="text-sm md:text-base text-white/75">
                  We work closely with operators and public agencies to design software that fits
                  into existing workflows while setting a new standard for how parking and curb
                  space should work.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-xs md:text-sm text-white/85">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Engineering
                  </p>
                  <p>
                    Building scalable, cloud-native systems that connect every space, payment, and
                    event in real time.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Operations
                  </p>
                  <p>
                    Translating on-the-ground expertise into configurable playbooks that scale
                    across portfolios.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    City partnerships
                  </p>
                  <p>
                    Working with public agencies to modernize policy, pricing, and enforcement in a
                    software-first way.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    Customer success
                  </p>
                  <p>
                    Supporting partners from first pilot to full portfolio rollout with dedicated
                    expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Journey
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black mb-4">
                  We&apos;re just getting started.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Payparq is focused on building a long-term platform for cities and operators. Our
                  roadmap is shaped with partners who are rethinking how parking and curb space
                  should work over the next decade.
                </p>
              </div>
              <div className="text-xs md:text-sm text-black/70">
                <p>
                  The milestones here are a snapshot of where we are and where we&apos;re heading.
                  We evolve the platform continuously as new fleets, modes, and expectations arrive.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-x-auto pb-4 -mx-6 md:mx-0">
                <div className="flex gap-4 md:gap-6 px-6 md:px-0 snap-x snap-mandatory">
                  <div className="snap-center min-w-[240px] md:min-w-[260px] rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                        Foundations
                      </p>
                      <p className="text-sm font-semibold text-black">
                        Software-first approach
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-black/75">
                      Starting from a mobile, software-only view of parking so partners can grow
                      without installing heavy, inflexible infrastructure.
                    </p>
                  </div>
                  <div className="snap-center min-w-[240px] md:min-w-[260px] rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                        Pilots
                      </p>
                      <p className="text-sm font-semibold text-black">
                        Proving impact with partners
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-black/75">
                      Working closely with early operators and cities to validate uplift, refine
                      the product, and build repeatable playbooks.
                    </p>
                  </div>
                  <div className="snap-center min-w-[240px] md:min-w-[260px] rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                        Scale
                      </p>
                      <p className="text-sm font-semibold text-black">
                        Portfolio-wide deployments
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-black/75">
                      Expanding from individual sites to portfolios, with standardized tools for
                      pricing, enforcement, analytics, and reporting.
                    </p>
                  </div>
                  <div className="snap-center min-w-[240px] md:min-w-[260px] rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                        Future
                      </p>
                      <p className="text-sm font-semibold text-black">
                        Connected urban mobility
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-black/75">
                      Extending beyond parking to power connected journeys across modes, districts,
                      and emerging mobility ecosystems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.5fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                Stay close
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Follow our progress and partnerships.
              </h2>
              <p className="text-sm md:text-base text-white/75 mb-5">
                From new city launches to product releases, we share how Payparq is helping partners
                modernize parking and curb space across markets.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  <span>Visit Newsroom</span>
                </Link>
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors"
                >
                  <span>View Careers</span>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm text-xs md:text-sm text-white/80 transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                Partners
              </p>
              <p className="mb-3">
                We collaborate with operators, owners, and cities who want to treat parking as a
                strategic part of urban mobility and real estate, not an afterthought.
              </p>
              <p>
                If you&apos;d like to explore a pilot or portfolio rollout, our team would love to
                connect.
              </p>
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
              <button className="block hover:text-white transition-colors">Legal</button>
              <button className="block hover:text-white transition-colors">Privacy</button>
              <button className="block hover:text-white transition-colors">Terms</button>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Platform
              </p>
              <button className="block hover:text-white transition-colors">Partners</button>
              <button className="block hover:text-white transition-colors">Support</button>
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
