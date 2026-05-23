"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function SiteHeader({ hideAnnouncementBar = false }: { hideAnnouncementBar?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[1000] pointer-events-none font-apple-ui notranslate"
      data-no-translate="true"
      translate="no"
      suppressHydrationWarning
    >
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
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
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
                href="/search"
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
                  href="/home"
                  className="w-full block py-3 text-center hover:bg-gray-100 transition-colors text-[12px] font-medium text-black"
                  onClick={() => setMobileOpen(false)}
                >
                  Početna
                </Link>
                <Link href="/vision" className="w-full py-3 text-center hover:bg-gray-100 transition-colors">
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
                  <div className="flex flex-col gap-1 pb-1 items-center">
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
                  <div className="flex flex-col gap-1 pb-1 items-center">
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
                  className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Pay Now
                </Link>
              </div>
            </div>
          )}
          {hideAnnouncementBar ? null : (
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
          )}
        </div>
      </div>
    </header>
  );
}
