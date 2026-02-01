"use client";

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function Careers() {
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
                        href="/business"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
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
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.4fr,1fr] items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Careers
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5 text-black">
                Make an impact on how cities move and park.
              </h1>
              <p className="text-sm md:text-base text-black/75 mb-5 max-w-xl">
                Payparq is building a software-only platform for parking and urban mobility. We are
                assembling a focused team across product, engineering, operations, and partnerships to
                redesign how parking portfolios are run.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#open-roles"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors"
                >
                  <span>View open roles</span>
                </Link>
                <a
                  href="mailto:careers@payparq.ai"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 text-xs font-semibold text-black hover:bg-black/5 transition-colors"
                >
                  <span>Contact recruiting</span>
                </a>
              </div>
            </div>
            <div className="grid gap-4 text-xs md:text-sm text-black/80">
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                  Our mission
                </p>
                <p>
                  Turn every parking space into a connected digital asset that supports better mobility
                  and stronger real estate performance.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-4 transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/60 mb-1">
                  Who we hire
                </p>
                <p className="text-white/80">
                  Builders who are comfortable with ambiguity, care deeply about cities, and want to
                  create software that outlasts individual projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.3fr,1.1fr] items-start">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">
                How we invest in you
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                A team built to do the best work of their careers.
              </h2>
              <p className="text-sm md:text-base text-black/75">
                At Payparq, we want people to grow with the company. We focus on benefits, working
                practices, and environments that support deep focus, clear ownership, and sustainable
                pace.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-xs md:text-sm text-black/80">
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Health and wellbeing
                </p>
                <p>
                  Competitive health coverage and wellbeing support so you can focus on building, not
                  logistics.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Time off
                </p>
                <p>
                  Flexible time off policies and company holidays to recharge and think long-term.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Ownership mindset
                </p>
                <p>
                  Meaningful responsibility from day one, with the expectation that everyone shapes how
                  we operate.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Learning and growth
                </p>
                <p>
                  Support for learning, experimentation, and cross-functional work as we scale the
                  platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1.2fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  How we work
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  We move with ownership, curiosity, and care for cities.
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-4">
                  Payparq is a product-led team. We work in close partnership with operators and cities,
                  with a bias toward shipping, listening, and iterating quickly.
                </p>
                <p className="text-sm md:text-base text-white/75">
                  We value people who are comfortable taking responsibility, asking hard questions, and
                  collaborating across disciplines to build resilient systems.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-xs md:text-sm text-white/85">
                <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    We are builders
                  </p>
                  <p>
                    We experiment, measure, and refine. We prefer shipping small improvements over
                    chasing perfect plans.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    We are owners
                  </p>
                  <p>
                    We take responsibility for outcomes and the experience we create for partners and
                    drivers.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                    We are teammates
                  </p>
                  <p>
                    We challenge ideas, not people, and we assume positive intent as we build together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.3fr,1.1fr] items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Where we work
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black mb-4">
                Built for flexibility, anchored in cities.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                Payparq operates with a distributed team model, with teammates working from key hubs and
                remotely. We care more about collaboration and impact than where you open your laptop.
              </p>
              <p className="text-sm md:text-base text-black/75">
                We are especially excited to work with people close to our operator and city partners, so
                we can keep learning directly from the environments we serve.
              </p>
            </div>
            <div className="grid gap-4 text-xs md:text-sm text-black/85">
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Hubs
                </p>
                <p>
                  Growing presence in key European and global cities where mobility and real estate are
                  rapidly evolving.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  Remote-friendly
                </p>
                <p>
                  Roles that support deep individual focus and asynchronous collaboration across time
                  zones.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  On-site partnerships
                </p>
                <p>
                  Field roles that work closely with operators and cities to deploy, learn, and refine
                  the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="open-roles" className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Open roles
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Join Payparq as we scale the platform.
                </h2>
                <p className="text-sm md:text-base text-white/75">
                  We are growing thoughtfully. If you do not see a role that fits yet, you can still
                  reach out and share how you&apos;d like to contribute.
                </p>
              </div>
              <div className="text-xs md:text-sm text-white/70">
                <p className="mb-2">
                  For general interest, email{" "}
                  <a href="mailto:careers@payparq.ai" className="underline hover:text-white">
                    careers@payparq.ai
                  </a>
                  .
                </p>
                <p>We review every introduction and follow up when there is a strong match.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8 text-xs md:text-sm text-white/80">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                  Example teams
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/25 text-[11px] text-white/80">
                    Product &amp; Design
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/25 text-[11px] text-white/80">
                    Engineering
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/25 text-[11px] text-white/80">
                    Operations
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/25 text-[11px] text-white/80">
                    City &amp; Partner Success
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 text-white/70">
                <p>
                  As we formalize our hiring roadmap, this space will surface specific roles. For now,
                  we prioritize people who are excited to work at the intersection of mobility, software,
                  and cities.
                </p>
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
              <Link href="/support" className="block hover:text-white transition-colors">
                Support
              </Link>
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
