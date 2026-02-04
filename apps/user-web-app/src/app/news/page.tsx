"use client";

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function News() {
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
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
              Company
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
              Payparq news.
            </h1>
            <p className="text-sm md:text-base text-black/75">
              Explore product updates, launches, and stories from Payparq partners as we roll out
              software-first parking portfolios across new cities and assets.
            </p>
          </div>
        </section>
        
        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  PayParq Blog
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black mb-4">
                  Ideas, case studies, and field notes.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Stories from deployments across Croatia and beyond — how software-first parking
                  improves traffic flow, protects resident bays, and unlocks capacity.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Link
                href="/news/blog/park-taxi-brela"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Case Study — Brela, Croatia
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Park &amp; Taxi: 20–40 cars captured daily and routed to remote lots
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Software-only flow at a seaside chokepoint on the Makarska Riviera reduces
                    congestion and protects resident zones while improving arrivals.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read post →
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                  In the news
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-black mb-4">
                  How others are writing about Payparq.
                </h2>
                <p className="text-sm md:text-base text-black/75">
                  Selected coverage from Croatian and international media on how Payparq is helping
                  unlock new parking capacity and transform spaces into digital assets.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">
                  Follow Payparq
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.tiktok.com/@payparq"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Payparq on TikTok"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  >
                    <span className="text-[11px] font-semibold">Tt</span>
                  </a>
                  <a
                    href="https://www.instagram.com/payparq.ai/?hl=hr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Payparq on Instagram"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  >
                    <span className="text-[11px] font-semibold">Ig</span>
                  </a>
                  <a
                    href="https://www.youtube.com/@karlozamic348"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Payparq on YouTube"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  >
                    <span className="text-[11px] font-semibold">Yt</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <a
                href="https://www.vecernji.hr/vijesti/startup-iz-dalmacije-osvaja-hrvatsku-i-nezaustavljivo-se-siri-zauvijek-cemo-promijeniti-nacin-parkiranja-1875926"
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Večernji list
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Startup iz Dalmacije osvaja Hrvatsku
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Report on how Payparq, launched from Brela, is reshaping parking across Croatia
                    and building a platform with global potential.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read article →
                </div>
              </a>

              <a
                href="https://total-croatia-news.com/news/croatian-startup-payparq/"
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Total Croatia News
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Croatian startup PayParq gaining traction nationwide
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    English-language feature on Payparq&apos;s origins in Brela and how the platform
                    connects landowners, operators, and drivers.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read article →
                </div>
              </a>

              <a
                href="https://novac.jutarnji.hr/novac/aktualno/start-up-iz-brela-pokrenuo-revoluciju-privatna-parkiralista-sada-dostupna-svima-15602363"
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Jutarnji list / Novac
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Start-up iz Brela pokrenuo revoluciju
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Story about Payparq as an &quot;Airbnb for parking&quot; and how private
                    parking becomes accessible through a digital platform.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read article →
                </div>
              </a>

              <a
                href="https://www.poslovni.hr/hrvatska/startup-iz-dalmacije-osvaja-hrvatsku-zauvijek-cemo-promijeniti-nacin-parkiranja-4492394"
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Poslovni dnevnik
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Startup iz Dalmacije osvaja Hrvatsku
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Business-focused coverage of Payparq&apos;s model, investment potential, and
                    plans for expansion beyond Croatia.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read article →
                </div>
              </a>
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

