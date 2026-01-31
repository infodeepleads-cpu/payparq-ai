'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

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
                    onClick={() => setCompanyOpen((open) => !open)}
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
                Smart City
              </p>
              <h1 className="text-3xl md:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-5">
                Mapping the Future of Parking.
              </h1>
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6">
                We digitize every space with Mobile LPR and AI Computer Vision to turn static lots into
                responsive digital assets. Delivering frictionless automated parking for drivers and
                real-time data for global partners.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                  <span>Talk to Sales</span>
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors">
                  <span>Download Overview</span>
                </button>
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
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Digitizing the World’s Parking Infrastructure
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                Digitizing the World’s Parking Infrastructure.
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                We transform static pavement into a high-fidelity digital map. By digitizing every
                space, we create responsive environments that drive maximum asset yield and frictionless
                urban mobility.
              </p>
              <div className="space-y-4 text-sm md:text-base text-black/80">
                <div>
                  <p className="font-semibold mb-1">AI-Driven Space Intelligence</p>
                  <ul className="list-disc list-inside text-xs md:text-sm text-black/75 space-y-1">
                    <li>Mobile LPR Recognition: Real-time, high-accuracy vehicle identification across any geography.</li>
                    <li>Total Space Digitization: We map every stall, turning physical inventory into live digital data.</li>
                    <li>Automated Revenue Recovery: Frictionless access and payments that eliminate leakage.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Advanced Computer Vision at Scale</p>
                  <ul className="list-disc list-inside text-xs md:text-sm text-black/75 space-y-1">
                    <li>
                      Our tech doesn&apos;t just scan; it indexes. By creating a digital twin of every parking asset, our
                      platform optimizes occupancy and automates enforcement in real time.
                    </li>
                    <li>
                      Global Reach, Local Precision: The world&apos;s most scalable LPR parking platform.
                    </li>
                    <li>
                      Rapid Deployment: Digitizing entire portfolios with zero infrastructure lag.
                    </li>
                    <li>Data-Backed Performance: Advanced analytics to outpace local market trends.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="h-64 md:h-80 rounded-3xl overflow-hidden border border-black/5 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-1">
                  Digital twin
                </p>
                <p className="text-sm md:text-base font-semibold">
                  A live digital map of every parking asset you operate.
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
                  Zero CapEx. Live in 3 Days.
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  Zero CapEx. Live in 3 Days.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  PayParq deploys customized technology at zero upfront cost. Our vertically-integrated
                  platform enables seamless onboarding and scalability across your entire portfolio.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs md:text-sm text-black/70">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Global Space Digitization
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Mobile LPR
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  AI Computer Vision
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 bg-white">
                  Data-driven Infrastructure
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs md:text-sm text-black/80 mb-10">
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Zero CapEx Infrastructure
                </p>
                <p>
                  Deploy advanced Computer Vision with no upfront hardware costs, aligning spend with
                  performance.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Rapid Digital Onboarding
                </p>
                <p>Your entire parking portfolio digitized and live in under 30 days.</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Built for Global Scale
                </p>
                <p>
                  Seamlessly manage assets across cities with a single, unified cloud-based dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-2">
                  Software-First Efficiency
                </p>
                <p>
                  Trade failing gates and kiosks for Mobile LPR and high-accuracy AI recognition.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6" />
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.6fr,1fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                The Future of Smart Real Estate
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                “Digitizing our parking inventory was the turning point.”
              </h2>
              <p className="text-sm md:text-base text-black/80 mb-4">
                “Digitizing our parking inventory was the turning point. We stopped managing pavement and
                started managing a high-yield digital asset.”
              </p>
              <p className="text-xs md:text-sm text-black/60 mb-6">— Ivica, PayParq partner</p>
              <div className="space-y-4 text-xs md:text-sm text-black/80">
                <div>
                  <p className="font-semibold mb-1">Intelligence at the Edge.</p>
                  <p>
                    Convert static parking stalls into a responsive AI-powered digital map in days. Our
                    Mobile LPR technology eliminates the need for heavy hardware, turning any location into
                    a smart environment.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Zero CapEx Infrastructure</li>
                  <li>Rapid Digital Onboarding</li>
                  <li>Built for Global Scale</li>
                  <li>Software-First Efficiency</li>
                  <li>Proven Digital Transformation with higher NOI.</li>
                </ul>
              </div>
            </div>
            <div className="h-56 md:h-72 rounded-3xl overflow-hidden border border-black/5 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.pexels.com/photos/3768236/pexels-photo-3768236.jpeg?auto=compress&cs=tinysrgb&w=1600')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                Us vs Them
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                PayParq vs legacy parking systems.
              </h2>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-white/5">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-white/10 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Capability</th>
                    <th className="px-4 py-3 font-semibold">PayParq</th>
                    <th className="px-4 py-3 font-semibold">Legacy Systems</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Deployment model</td>
                    <td className="px-4 py-3">Zero CapEx, software-first Mobile LPR.</td>
                    <td className="px-4 py-3">Heavy hardware, gated access, high upfront cost.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Speed to go live</td>
                    <td className="px-4 py-3">Entire portfolios live in days.</td>
                    <td className="px-4 py-3">Slow phased installs over months or years.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Space intelligence</td>
                    <td className="px-4 py-3">
                      Global space digitization and AI Computer Vision across every stall.
                    </td>
                    <td className="px-4 py-3">Limited, hardware-bound visibility at each site.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Revenue protection</td>
                    <td className="px-4 py-3">
                      Automated revenue recovery and real-time enforcement.
                    </td>
                    <td className="px-4 py-3">Manual enforcement and frequent leakage.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Portfolio management</td>
                    <td className="px-4 py-3">
                      Global reach, local precision via unified cloud dashboard.
                    </td>
                    <td className="px-4 py-3">Fragmented tools and siloed local systems.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-black/5">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.2fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  Talk to Sales
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  Ready to digitize your parking portfolio?
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-6">
                  Share a few details about your assets and our team will come back with a tailored
                  deployment plan, including expected uplift and time to go live.
                </p>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-black/70 mb-1">
                        Work email
                      </label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black/70 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">
                      Portfolio details
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                      placeholder="Number of locations, cities, and approximate spaces..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors"
                  >
                    Submit
                  </button>
                </form>
              </div>
              <div className="h-56 md:h-full rounded-3xl border border-black/5 bg-[#F5F5F7] flex flex-col justify-between p-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                    Why this matters for your portfolio
                  </p>
                  <p className="text-xs md:text-sm text-black/75 mb-3">
                    With PayParq, every parking space becomes a managed digital asset. Operators gain
                    live visibility into occupancy, revenue, and compliance and can act on it from a
                    single pane of glass.
                  </p>
                  <p className="text-xs md:text-sm text-black/75">
                    By standardizing payments, enforcement, and reporting across sites, you protect NOI,
                    reduce leakage, and give investors a clear view of how each asset performs in the
                    real world.
                  </p>
                </div>
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
