'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function Contact() {
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
                  <Link href="/vision" className="hover:text-gray-700 transition-colors">
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
                    href="/vision"
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
        <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-black">
            Welcome to PayParq
          </h1>
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <p className="text-sm md:text-base text-black/80">
              I want to park at a PayParq location.
            </p>
            <Link
              href="/members"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="space-y-6 text-sm md:text-base text-black/80">
            <div>
              <p className="font-semibold mb-1">Q: What are you looking for?</p>
              <p>
                A: Whether you&apos;re visiting a city or managing a property, PayParq makes parking simple, seamless,
                and digital.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">
                Q: I&apos;m at a PayParq location and want to park. How do I get started?
              </p>
              <p>
                A: First-time parking with PayParq? Sign up via our web app or mobile app. Add your vehicle and payment
                method, and start parking immediately.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">
                Q: Parked with PayParq before. Do I need to do anything?
              </p>
              <p>
                A: No additional action is required. You can manage your visit by signing in to our web app or using our
                mobile app.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Q: Interested in PayParq?</p>
              <p>
                A: Please fill out our sales contact form, and a member of our team will get in touch shortly.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Q: How can I purchase a monthly parking subscription?</p>
              <p>
                A:{" "}
                <Link href="/pay" className="underline">
                  Click here
                </Link>{" "}
                to select your preferred location and subscribe to a monthly plan.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">
                Q: I need help with my account, technical issues, or payments.
              </p>
              <p>
                Visit the{" "}
                <a
                  href="https://payparq.ai/help"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Driver Help Center
                </a>{" "}
                for support.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Q: How do I pay or dispute a parking notice?</p>
              <p>
                A: Go to{" "}
                <Link href="/payments" className="underline">
                  PayParq Payments
                </Link>{" "}
                to complete payments or submit disputes.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Q: I&apos;m a member of the press. How can I contact PayParq?</p>
              <p>
                A: Email us at{" "}
                <a href="mailto:payparq@outlook.com" className="underline">
                  payparq@outlook.com
                </a>
                .
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Q: Are there career opportunities at PayParq?</p>
              <p>
                A: Visit our{" "}
                <Link href="/careers" className="underline">
                  Careers
                </Link>{" "}
                page to view open positions and apply for a job.
              </p>
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
                  From mixed-use garages to open-air lots, payparq turns any space into a seamless, app-free arrival
                  experience while unlocking new revenue.
                </p>
                <a
                  href="https://www.admin.payparq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs">Manage Smarter, Earn More</span>
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Company</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Vision</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
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
