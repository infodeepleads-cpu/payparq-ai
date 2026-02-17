'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <header className="hidden">
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
                  <Link
                    href="/vision"
                    className="hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50"
                  >
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
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50 text-[10px]"
                      onClick={() => {
                        setBusinessOpen((open) => !open);
                        setCompanyOpen(false);
                      }}
                    >
                      <span>BUSINESS</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 top-full bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/technology"
                    className="hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50"
                  >
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
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50 text-[10px]"
                      onClick={() => {
                        setCompanyOpen((open) => !open);
                        setBusinessOpen(false);
                      }}
                    >
                      <span>COMPANY</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute right-0 top-full bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/about"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
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
                <div className="flex flex-col gap-2 pt-2 text-[11px] font-medium text-black w-full max-w-xs mx-auto">
                  <Link
                    href="/vision"
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
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                  >
                    Pay Now
                  </Link>
                </div>
              </div>
            )}
            <div className="bg-black text-white text-[11px] text-center py-2 px-4 whitespace-nowrap">
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

      <main className="flex-1 bg-white">
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/5847385/pexels-photo-5847385.jpeg?auto=compress&cs=tinysrgb&w=1920')",
              }}
            />
            <div className="absolute inset-0 bg-white/5" />
            <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-gradient-to-br from-[#5F3DFC]/10 via-transparent to-transparent opacity-80 blur-3xl -translate-y-1/3 translate-x-1/5 pointer-events-none" />
          </div>
          <div className="relative z-10 w-full px-6 md:px-24 flex items-center md:items-end justify-center md:justify-start min-h-screen pt-36 md:pt-32">
            <div className="max-w-md mb-12 md:mb-24 text-black text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-semibold md:font-bold tracking-tight leading-tight mb-6">
                payparq makes cities{" "}
                <span className="text-[#5F3DFC]">move with you</span>
              </h1>
              <p className="text-base md:text-xl text-black font-medium mb-8 max-w-xl mx-auto md:mx-0">
                The world’s first mobile software-only platform for frictionless urban mobility.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                <Link
                  href="/discover-how"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-800 transition-colors"
                >
                  <span>Discover How</span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#5F3DFC] to-[#FF5CF5] flex items-center justify-center text-white text-[10px]">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-black/5">
          <div className="max-w-4xl mx-auto px-6 py-10 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
                Get in touch
              </p>
              <h3 className="text-xl md:text-2xl font-semibold text-black mb-1">
                Ready to modernise your parking?
              </h3>
              <p className="text-sm text-black/70 max-w-md">
                Talk to our team or go straight to payment with Payparq.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-full border border-gray-300 text-[11px] font-semibold text-black hover:bg-gray-50 transition-colors"
              >
                Get in Touch
              </Link>
              <Link
                href="/pay"
                className="px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
              >
                Pay Now
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                  For drivers, operators, and cities
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">
                  Frictionless access to anywhere you want to be
                </h2>
                <p className="text-sm text-white/70 mb-6 max-w-md">
                  From mixed-use garages to open-air lots, payparq turns any space into a
                  seamless, app-free arrival experience while unlocking new revenue.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors">
                  <span className="text-xs">Download on the App Store</span>
                </button>
              </div>
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
                    Vision
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
