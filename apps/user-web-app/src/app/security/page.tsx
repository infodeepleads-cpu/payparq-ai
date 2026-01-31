 "use client";

import { useState } from "react";
import Link from "next/link";

export default function Security() {
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
                      <span className="text-[8px] leading-none">▾</span>
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/business"
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
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

      <main className="flex-1 bg-[#05020A] pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-16 md:pb-20">
          <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                Our partners
              </p>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
                Real-time space intelligence.
              </h1>
              <p className="text-sm md:text-base text-white/75 mb-6">
                Digitize every stall with AI-powered recognition that keeps your parking assets safer,
                smarter, and always in view.
              </p>
              <div className="grid gap-4 text-xs md:text-sm text-white/80">
                <div>
                  <p className="font-semibold mb-1">
                    Precise digital mapping for every space
                  </p>
                  <p>
                    Our technology does more than watch. It indexes every stall into a live digital twin
                    of your infrastructure, giving operations teams total visibility and automated
                    protection.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/5 via-white/0 to-[#4C46E5]/20 p-6 flex flex-col justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-2">
                  Partner ecosystem
                </p>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">W</span>
                    <span className="sr-only">WhatsApp</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">U</span>
                    <span className="sr-only">Uber</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">G</span>
                    <span className="sr-only">Google</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">S</span>
                    <span className="sr-only">Supabase</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">V</span>
                    <span className="sr-only">Vercel</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">C</span>
                    <span className="sr-only">Cloudflare</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">T</span>
                    <span className="sr-only">TikTok</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">Y</span>
                    <span className="sr-only">YouTube</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">I</span>
                    <span className="sr-only">Instagram</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/20 bg-white/10">
                    <span className="text-xs font-semibold">M</span>
                    <span className="sr-only">Microsoft</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 mb-2">
                  Real-time portfolio insight
                </p>
                <p className="text-xs md:text-sm text-white/75">
                  See occupancy, enforcement, and risk in one place so your teams can act before issues
                  impact revenue or experience.
                </p>
              </div>
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

        <section className="bg-[#05020A] text-white border-t border-white/10">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.3fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Request a demo
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  See Payparq security in action.
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-6">
                  Explore how AI-powered recognition and digital mapping protect every parking space while
                  keeping the journey effortless for drivers.
                </p>
                <div className="grid gap-4 text-xs md:text-sm text-white/80">
                  <div>
                    <p className="font-semibold mb-1">Portfolio-wide coverage</p>
                    <p>
                      From high‑turnover retail to long‑stay assets, unify visibility across every site in
                      one secure view.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Real-time alerts</p>
                    <p>
                      Surface unauthorized stays, anomalies, and revenue risk as they happen, not days
                      later in reports.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <form className="space-y-4 text-xs md:text-sm">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/80 mb-1">
                        Work email
                      </label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-white/80 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Portfolio details
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/60 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 inline-flex w-full justify-center items-center bg-white text-black text-[12px] font-semibold py-2.5 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    Talk to sales
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/60">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} payparq</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/40" />
            <span>Security</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <button className="hover:text-white transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
