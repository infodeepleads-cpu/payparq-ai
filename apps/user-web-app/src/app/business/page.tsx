'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function Business() {
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
                  <Link href="/experience" className="hover:text-gray-700 hover:underline underline-offset-4 transition-colors">
                    Experience
                  </Link>
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setBusinessOpen(true);
                      setCompanyOpen(false);
                    }}
                    onMouseLeave={() => setBusinessOpen(false)}
                  >
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
                          className="block px-4 py-2 text-center hover:bg-gray-50 hover:underline underline-offset-4 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 hover:underline underline-offset-4 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 hover:underline underline-offset-4 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 hover:underline underline-offset-4 transition-colors">
                    Technology
                  </Link>
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setCompanyOpen(true);
                      setBusinessOpen(false);
                    }}
                    onMouseLeave={() => setCompanyOpen(false)}
                  >
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
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                  <span>Talk to our team</span>
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors">
                  <span>See how it works</span>
                </button>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs md:text-sm">
              <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Intelligence
                </p>
                <p className="font-semibold mb-1">Real-time curb visibility</p>
                <p className="text-white/75">
                  Live occupancy, payments, and enforcement in one view so you can manage every bay
                  as a dynamic asset.
                </p>
              </div>
              <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Automation
                </p>
                <p className="font-semibold mb-1">Frictionless experience</p>
                <p className="text-white/75">
                  Fully mobile, ticketless journeys across payment, access, and compliance with no
                  queues or hardware friction.
                </p>
              </div>
              <div className="border border-white/15 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Performance
                </p>
                <p className="font-semibold mb-1">Asset-level results</p>
                <p className="text-white/75">
                  Data tools that surface revenue, dwell time, and compliance to optimize pricing and
                  performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Software-first deployment
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                Zero heavy hardware. Live in weeks, not months.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                Payparq is built as a software-only layer that sits on top of your existing
                infrastructure. Mobile payments, license-plate recognition, and enforcement tools work
                together so you can standardize operations across locations without digging up a
                single lane.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm text-black/80">
                <div>
                  <p className="font-semibold mb-1">Zero CapEx model</p>
                  <p>
                    Deploy Payparq with minimal upfront spend and align costs to performance and
                    revenue.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Go live rapidly</p>
                  <p>
                    Standardized playbooks get new sites running in a fraction of the time of
                    traditional hardware.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Less hardware, more insight</p>
                  <p>
                    Replace complex gates and kiosks with software that is easier to maintain and
                    continuously improving.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Portfolio-wide control</p>
                  <p>
                    Configure rules, tariffs, and permissions centrally and push them to every asset
                    in your network.
                  </p>
                </div>
              </div>
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
              <div className="relative h-full flex flex-col justify-end p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-1">
                  Portfolio
                </p>
                <p className="text-sm md:text-base font-semibold">
                  Standardized, software-only deployments across complex urban assets.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Operations at scale
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  Built to run real parking businesses, not just single sites.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Whether you manage municipal on-street portfolios or mixed-use garages, Payparq
                  brings together the tools and data your teams need to execute at scale while keeping
                  the driver experience effortless.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-black">
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Uptime
                  </p>
                  <p className="text-xl font-semibold">99.9%</p>
                  <p className="text-xs text-black/70 mt-1">
                    Cloud-native platform engineered for reliability across busy urban environments.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Expansion
                  </p>
                  <p className="text-xl font-semibold">Portfolio-wide</p>
                  <p className="text-xs text-black/70 mt-1">
                    Easily replicate best-performing playbooks across locations and cities.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Visibility
                  </p>
                  <p className="text-xl font-semibold">Real-time</p>
                  <p className="text-xs text-black/70 mt-1">
                    Live dashboards on occupancy, compliance, and revenue across every asset.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Support
                  </p>
                  <p className="text-xl font-semibold">Partner-first</p>
                  <p className="text-xs text-black/70 mt-1">
                    Dedicated teams focused on your portfolio’s performance and on-the-ground needs.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-black/80">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Actionable insights
                </p>
                <p>
                  Granular data on stay length, demand peaks, and compliance helps fine-tune pricing,
                  product mix, and enforcement strategy.
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Integrated workflows
                </p>
                <p>
                  From digital permits to enforcement routes, Payparq slots into existing processes
                  and simplifies complex operational tasks.
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Continuous learning
                </p>
                <p>
                  Machine learning models improve with every session, helping you anticipate demand
                  and respond before issues appear on site.
                </p>
              </div>
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
              <div className="h-64 md:h-72 rounded-3xl overflow-hidden border border-white/10 relative">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.pexels.com/photos/1488385/pexels-photo-1488385.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05020A] via-black/40 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-1">
                    Smart portfolio
                  </p>
                  <p className="text-sm md:text-base font-semibold">
                    Connected across city centers, residential, retail, and office.
                  </p>
                </div>
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
            <div className="grid gap-10 md:grid-cols-[1.3fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Dalmatian coast
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  AI mobile LPR for Split, Makarska and Dubrovnik.
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-3">
                  Tourist seasons in Split, Makarska and Dubrovnik bring full streets, circling cars
                  and overloaded car parks. Manual patrols and fragmented systems make it hard for
                  municipalities and operators to keep up with the volume of visitors.
                </p>
                <p className="text-sm md:text-base text-black/75 mb-3">
                  Payparq replaces paper lists and slow checks with a mobile license plate
                  recognition app and live dashboard. From the Riva in Split to the promenades in
                  Makarska and the streets around Dubrovnik&apos;s Old Town, every scan, violation
                  and zone is visible in real time.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs md:text-sm text-black/80">
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="font-semibold mb-1">Dashboard for control rooms</p>
                    <p>
                      Live occupancy per street, zone and car park, with violation statistics and
                      history for pricing and capacity decisions.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="font-semibold mb-1">Mobile LPR for field teams</p>
                    <p>
                      Fast plate recognition from any Android device, online or offline, with
                      instant checks against payments, permits and whitelists.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-5 text-xs md:text-sm text-black/80">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
                  Results for coastal cities
                </p>
                <p className="mb-2">
                  By combining mobile LPR with live analytics, cities and operators on the
                  Dalmatian coast see more collected revenue, faster patrols and fewer disputes.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>15–30% more collected parking fees and fines.</li>
                  <li>Up to 50% faster patrol cycles.</li>
                  <li>Transparent, auditable history for every enforcement action.</li>
                </ul>
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

        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="border border-black/5 rounded-3xl px-6 py-10 md:px-10 md:py-12 bg-[#F5F5F7]">
              <div className="grid gap-8 md:grid-cols-[2fr,1fr] items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                    Partner perspective
                  </p>
                  <p className="text-base md:text-lg text-black/85 mb-4">
                    “Parking should be invisible to the journey. Payparq lets us deliver that kind
                    of experience while still treating every bay as a serious revenue driver.”
                  </p>
                  <p className="text-xs md:text-sm text-black/60">
                    — Portfolio operator partner
                  </p>
                </div>
                <div className="h-40 rounded-2xl overflow-hidden border border-black/10 relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
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
