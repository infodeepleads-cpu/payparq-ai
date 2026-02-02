'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronDown } from "lucide-react";
import { FooterBrand } from "@/components/FooterBrand";
import MapboxPlaceholder from "@/components/MapboxPlaceholder";

const LOCATION_ID = "parkng split airport";

export default function SplitAirportLocationPage() {
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
                  href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Book Parking
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
                      <Link
                        href="/contact"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
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
                    href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book Parking
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-16 md:pt-20">
        <article className="max-w-6xl mx-auto px-4 md:px-10 pt-4 pb-12 md:pt-6 md:pb-16">
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-6 md:mb-8 text-black md:-ml-10">
            Split Airport parking from €0.37 per hour - just 2 minutes away.
          </h1>

          <section className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-8 md:-ml-10">
              <div className="h-full min-h-[480px] rounded-3xl overflow-hidden border border-black/5 bg-black shadow-lg">
                <div className="relative w-full h-full">
                  <Image
                    src="/Split_Airport_new_terminal_main_hall.jpg"
                    alt="Split Airport new terminal main hall"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#4B5563_0,_transparent_55%),radial-gradient(circle_at_bottom,_#1F2937_0,_transparent_55%)]" />
                  <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                        Split Airport car park
                      </p>
                      <p className="text-sm md:text-base text-white font-semibold">
                        Rows of covered and open-air parking bays, ready for take-off.
                      </p>
                    </div>
                    <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] text-white/80 border border-white/20">
                      Photo of Split Airport parking
                    </span>
                  </div>
                </div>
              </div>

              <MapboxPlaceholder locationId={LOCATION_ID} />

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    Airport parking just minutes from the terminal
                  </h2>
                  <p className="text-sm md:text-base text-black/75">
                    The PayParq-enabled car park at Split Airport is designed for fast arrivals and
                    smooth departures. Drive in, park in your allocated zone, and your license plate
                    links your stay to a live parking session. No paperwork, no barriers, and no
                    searching for a pay machine.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3 text-sm text-black/80">
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Location
                    </p>
                    <p className="font-semibold">Split Airport car park</p>
                    <p className="text-xs text-black/70 mt-1">
                      Walking distance from the terminal, with clearly marked PayParq zones.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Hours
                    </p>
                    <p className="font-semibold">24/7 access</p>
                    <p className="text-xs text-black/70 mt-1">
                      Perfect for early-morning departures, late arrivals, and seasonal flights.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Stays
                    </p>
                    <p className="font-semibold">Short- and long-term</p>
                    <p className="text-xs text-black/70 mt-1">
                      Choose flexible stays from a single day to extended trips from Split.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    How parking with PayParq works at Split Airport
                  </h2>
                  <ol className="list-decimal pl-5 text-sm md:text-base text-black/75 space-y-2">
                    <li>
                      Follow the signs to the PayParq zones at the Split Airport car park and park
                      in an available bay.
                    </li>
                    <li>
                      Scan the QR code on signage or visit the PayParq pay page and enter the
                      location ID shown:{" "}
                      <span className="font-mono text-xs">{LOCATION_ID}</span>.
                    </li>
                    <li>
                      Choose whether you want to park now, book a monthly pass, or reserve parking
                      for a future trip.
                    </li>
                    <li>
                      Checkout securely and receive your confirmation. Your plate is your access and
                      proof of payment.
                    </li>
                  </ol>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-5">
                    <h3 className="text-sm font-semibold text-black mb-2">
                      Designed for travelers flying from Split
                    </h3>
                    <p className="text-sm text-black/75">
                      Whether you are heading to European hubs or domestic destinations along the
                      Adriatic, PayParq keeps parking simple. Keep your keys, keep your schedule,
                      and keep your focus on the journey—not the car park.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-5">
                    <h3 className="text-sm font-semibold text-black mb-2">
                      Built on real-time parking data
                    </h3>
                    <p className="text-sm text-black/75">
                      The Split Airport location runs on the same platform trusted by coastal cities
                      and mixed-use portfolios. Operators see live occupancy, dwell times, and
                      compliance across every bay.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-2">
                  Frequently asked questions
                </h2>
                <div className="space-y-4 text-sm md:text-base text-black/80">
                  <div>
                    <h3 className="font-semibold mb-1">Do I need an app to park at Split Airport?</h3>
                    <p>
                      No. PayParq is app-free. Use the QR code or short URL on the signage, enter
                      the location ID, and complete payment in your browser.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Can I extend my parking if my flight is delayed?
                    </h3>
                    <p>
                      Yes. You can return to the PayParq link in your confirmation to extend your
                      stay while your car remains in the same bay.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Who operates the parking at Split Airport with PayParq?
                    </h3>
                    <p>
                      PayParq provides the software platform that powers payments, enforcement, and
                      analytics. Local operators and airports remain responsible for on-site
                      operations and policies.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col items-end md:sticky md:top-24">
              <div className="rounded-3xl border border-black/5 bg-white shadow-lg p-3 md:p-5 text-black h-full min-h-[480px] max-w-md ml-auto flex flex-col">
                <div className="flex flex-col h-full">
                  <div className="mb-5 flex flex-col items-center text-center text-black/80">
                    <div className="inline-flex items-center gap-2 text-[11px] md:text-sm">
                      <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1">
                        <span className="w-4 h-4 rounded-full bg-[#4285F4] text-[9px] font-bold text-white flex items-center justify-center">
                          G
                        </span>
                        <span className="text-[11px] md:text-sm font-semibold">Google</span>
                      </div>
                      <span className="font-semibold">4.9</span>
                      <span className="text-[10px] md:text-xs text-black/60">• 24,098 reviews</span>
                    </div>
                    <h2 className="mt-3 text-base md:text-xl font-semibold text-black">
                      Select Dates to Calculate Price
                    </h2>
                  </div>
                  <div className="flex-1 flex items-center justify-center mt-5 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex flex-col justify-between rounded-2xl border border-black/20 bg-white px-4 py-4 md:py-5 text-left shadow-sm hover:bg-[#F3F4FF] hover:border-[#5F3DFC] transition-colors">
                        <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-black/50">
                          Check In
                        </span>
                        <span className="mt-2 flex items-center justify-between text-base md:text-lg font-semibold text-black">
                          <span>Pick date</span>
                          <CalendarDays className="w-4 h-4 text-black/40" />
                        </span>
                      </button>
                      <button className="flex flex-col justify-between rounded-2xl border border-black/20 bg-white px-4 py-4 md:py-5 text-left shadow-sm hover:bg-[#F3F4FF] hover:border-[#5F3DFC] transition-colors">
                        <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-black/50">
                          Check Out
                        </span>
                        <span className="mt-2 flex items-center justify-between text-base md:text-lg font-semibold text-black">
                          <span>Pick date</span>
                          <CalendarDays className="w-4 h-4 text-black/40" />
                        </span>
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                    className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#5F3DFC] px-6 py-3.5 text-sm md:text-base font-semibold text-white shadow hover:bg-[#4330c4] transition-colors"
                  >
                    Check price
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </article>

        <section className="bg-[#05020A] border-t border-white/10">
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
        </section>
      </main>
    </div>
  );
}
