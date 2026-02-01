'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function Technology() {
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
            <div className="bg-black text-white text-[10px] md:text-[11px] text-center py-2 px-4 whitespace-nowrap">
              <span className="font-semibold">Payparq</span> powers Mobile LPR portfolios across dense urban traffic
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
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                  <span>Talk to Sales</span>
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors">
                  <span>Download Tech Overview</span>
                </button>
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
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Built for real cities
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                AI Computer Vision tuned for urban movement.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                From narrow historic streets to multi-level garages, Payparq&apos;s vision stack is
                trained for complex environments. Mobile LPR vehicles, handheld devices, and fixed camera
                feeds all write into the same live map of your portfolio.
              </p>
              <div className="space-y-4 text-sm md:text-base text-black/80">
                <div>
                  <p className="font-semibold mb-1">Computer Vision pipeline</p>
                  <ul className="list-disc list-inside text-xs md:text-sm text-black/75 space-y-1">
                    <li>High-fidelity plate reads at city speeds, day or night.</li>
                    <li>
                      Multi-frame verification reduces false positives in dense traffic and crowded
                      streets.
                    </li>
                    <li>
                      Geo-tagged events connect vehicles to exact bays, zones, and pricing rules in
                      real time.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Geo-intelligent layer</p>
                  <ul className="list-disc list-inside text-xs md:text-sm text-black/75 space-y-1">
                    <li>
                      Every stall modeled as a digital asset with attributes, time rules, and enforcement
                      logic.
                    </li>
                    <li>
                      Automated matching between plate events, tariffs, and payment data for instant
                      compliance checks.
                    </li>
                    <li>
                      City, district, and asset-level views to understand performance across regions.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="h-64 md:h-80 rounded-3xl overflow-hidden border border-black/5 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-1">
                  Real streets, real traffic
                </p>
                <p className="text-sm md:text-base font-semibold">
                  Optimized for moving vehicles, pedestrians, and mixed-use city centers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Platform capabilities
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  One software stack for every parking asset.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Payparq&apos;s Mobile LPR platform is built for operators, owners, and cities that need
                  real-time control without installing heavy infrastructure. Everything runs from the
                  cloud, from portfolio-wide pricing to local enforcement routes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs md:text-sm text-black/70">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Mobile LPR
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Space Digitization
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  AI Computer Vision
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Geo Intelligence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs md:text-sm text-black/80 mb-10">
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Mobile LPR fleets
                </p>
                <p>
                  Configure vehicles, routes, and capture rules centrally, then deploy across cities in
                  days instead of months.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Payments and enforcement
                </p>
                <p>
                  Automatically match plates to payments, permits, and tariffs to surface gaps and trigger
                  workflow actions.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Analytics and reporting
                </p>
                <p>
                  Understand occupancy, dwell time, and compliance trends by asset, street, or city for
                  data-driven decisions.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Developer APIs
                </p>
                <p>
                  Integrate Payparq into existing portals, city platforms, or partner applications with
                  secure APIs.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs md:text-sm text-black/80">
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Zero CapEx rollout
                </p>
                <p>
                  Deploy Mobile LPR and Computer Vision with minimal on-site hardware and no kiosks or
                  gates to maintain.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Global reach, local precision
                </p>
                <p>
                  Standardize technology across countries while honoring local rules, tariffs, and demand
                  patterns.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Continuous learning
                </p>
                <p>
                  Models improve with every capture, so your enforcement and pricing get sharper over
                  time.
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
              <div className="rounded-3xl border border-white/20 bg-white/5 p-6">
                <form className="space-y-4 text-xs md:text-sm">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Work email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Portfolio details
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-white/60"
                      placeholder="Number of locations, cities, and approximate spaces..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors w-full"
                  >
                    Submit
                  </button>
                </form>
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
              <button className="block hover:text-white transition-colors">Partners</button>
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
