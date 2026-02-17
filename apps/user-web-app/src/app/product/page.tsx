 'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import Image from "next/image";

export default function Product() {
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
                  <Link href="/product" className="hover:text-gray-900 transition-colors font-semibold">
                    Product
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
                  Talk to Sales
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
                  <button className="w-full mt-2 border-t border-b border-gray-200 py-3 text-center hover:bg-gray-100 transition-colors">
                    Talk to Sales
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
              <span className="font-semibold">Payparq</span> turns every parking space into a software-managed asset
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-24">
            <div className="grid gap-12 md:grid-cols-[1.4fr,1fr] items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Seamless. Simple. Built for partners.
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
                  One profile. Effortless parking across your entire network.
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-4">
                  With Payparq&apos;s connected mobile LPR app, drivers connect a vehicle once and instantly get access
                  to every participating lot, garage, and on-street zone. Visits start automatically on arrival and end
                  when the vehicle leaves.
                </p>
                <ul className="space-y-2 text-xs md:text-sm text-black/75">
                  <li>License plate recognition starts and stops sessions automatically.</li>
                  <li>Clear email receipts keep drivers informed without needing an app.</li>
                  <li>No gates, tickets, or payment hardware required on site.</li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="rounded-3xl border border-black/5 bg-[#05020A] text-white p-4 md:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.45)] max-w-xs w-full">
                  <div className="flex justify-center mb-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/20 bg-white/10 text-[11px] font-medium">
                      Phone to plate mobile LPR enforcement
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black/80 border border-white/10">
                    <Image
                      src="/Snimka%20zaslona%202026-01-31%20174200.png"
                      alt="Driver profile and recent parking sessions"
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-white/80">
                    A single profile powers access, payments, and receipts at every connected asset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                One platform. Many stakeholders.
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                A product that works for owners, operators, and every driver.
              </h2>
              <p className="text-sm md:text-base text-white/75">
                Payparq combines enforcement, payments, and analytics into a single platform so every group that touches
                parking gets a better experience.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3 text-xs md:text-sm text-white/80">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                  Real estate owners
                </p>
                <p>
                  Standardized digital revenue collection across assets, with live visibility into occupancy and yield.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Drivers</p>
                <p>
                  A consistent, predictable way to park at the curb, in garages, and in surface lots without extra
                  steps.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Building tenants</p>
                <p>
                  Digital validations and guest access tools replace hang tags and spreadsheets with a clean portal.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Property managers</p>
                <p>
                  A single dashboard to manage pricing, allocations, exceptions, and performance across properties.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Local operations</p>
                <p>
                  Mobile tools show live utilization and guide teams to where patrols, valet, or support are needed most.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Local businesses</p>
                <p>
                  Seamless digital validations keep spaces available for customers while still protecting the asset.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                Dashboard
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                A control room for permits, activity, and performance.
              </h2>
              <p className="text-sm md:text-base text-white/80">
                The Payparq dashboard brings every lot, permit, and visit into one place so teams can move from manual
                checks to proactive management.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 max-w-sm mx-auto">
                <Image
                  src="/Snimka%20zaslona%202026-01-31%20173642.png"
                  alt="Permits dashboard showing active permits and actions"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-xl mb-4"
                />
                <p className="text-sm text-white/80">
                  The Permits view centralises access for each lot. Teams can see active and upcoming permits, issue
                  guest passes, and adjust rules without touching hardware.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 max-w-sm mx-auto">
                <Image
                  src="/Snimka%20zaslona%202026-01-31%20174200.png"
                  alt="Home dashboard listing active sessions and driver details"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-xl mb-4"
                />
                <p className="text-sm text-white/80">
                  The Home view shows live sessions, driver details, and contact information so staff can resolve
                  issues quickly while keeping occupancy and compliance in view.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7] border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">
            <div className="max-w-3xl mb-12">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                Pricing
              </p>
              <h2 className="text-3xl md:text-[2.3rem] font-semibold tracking-tight mb-5 text-black">
                Flexible models that match how your assets earn.
              </h2>
              <p className="text-sm md:text-base text-black/70">
                From pure revenue share to models for LPR and digital displays, Payparq pricing is structured in €
                per spot per month. LPR and screens are delivered as software only, with no hardware bundles, so fees
                align with authorization, monetisation, or media needs.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-xs md:text-sm text-black/80">
              <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 flex flex-col gap-4 shadow-sm h-full">
                <div>
                  <p className="text-3xl md:text-4xl font-semibold tracking-tight">0</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mt-1">
                    Revenue share
                  </p>
                </div>
                <p className="text-sm md:text-base text-black/75">
                  Zero upfront cost. Revenue share on a mobile LPR experience delivered through our connected app.
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-[12px] text-black/70">
                  <li>Monetisation-led model on incremental collections.</li>
                  <li>Authorization, sessions, and payments handled in software.</li>
                  <li>€ per spot per month with upside share.</li>
                </ul>
                <button className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-black/10 bg-black text-white text-[11px] md:text-xs font-semibold hover:bg-black/90 transition-colors">
                  <span>Get in touch</span>
                </button>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 flex flex-col gap-4 shadow-sm h-full">
                <div>
                  <p className="text-3xl md:text-4xl font-semibold tracking-tight">10</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mt-1">
                    Authorization-first
                  </p>
                </div>
                <p className="text-sm md:text-base text-black/75">
                  For portfolios that want Payparq&apos;s mobile LPR and connected app as the primary authorization and
                  enforcement layer.
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-[12px] text-black/70">
                  <li>Plates, sessions, and enforcement unified in one platform.</li>
                  <li>Simple platform fee instead of revenue share.</li>
                  <li>€ per spot per month with predictable SaaS pricing.</li>
                </ul>
                <button className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-black/10 bg-black text-white text-[11px] md:text-xs font-semibold hover:bg-black/90 transition-colors">
                  <span>Get in touch</span>
                </button>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 flex flex-col gap-4 shadow-sm h-full">
                <div>
                  <p className="text-3xl md:text-4xl font-semibold tracking-tight">15</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mt-1">
                    LPR
                  </p>
                </div>
                <p className="text-sm md:text-base text-black/75">
                  Software-only LPR enforcement and case management that connects to your existing camera
                  infrastructure.
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-[12px] text-black/70">
                  <li>No hardware bundles; works with compatible cameras you already operate.</li>
                  <li>Ideal for portfolios standardising enforcement across sites.</li>
                  <li>€ per spot per month pricing.</li>
                </ul>
                <button className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-black/10 bg-black text-white text-[11px] md:text-xs font-semibold hover:bg-black/90 transition-colors">
                  <span>Get in touch</span>
                </button>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 flex flex-col gap-4 shadow-sm h-full">
                <div>
                  <p className="text-3xl md:text-4xl font-semibold tracking-tight">20</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mt-1">
                    Digital displays & DOOH
                  </p>
                </div>
                <p className="text-sm md:text-base text-black/75">
                  Digital signage and DOOH scheduling delivered as software, layered on top of Payparq access and
                  sessions.
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-[12px] text-black/70">
                  <li>Display and content management using your existing screens.</li>
                  <li>Promotions and information scheduled alongside parking content.</li>
                  <li>€ per spot per month with optional media revenue opportunities.</li>
                </ul>
                <button className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-black/10 bg-black text-white text-[11px] md:text-xs font-semibold hover:bg-black/90 transition-colors">
                  <span>Get in touch</span>
                </button>
              </div>
            </div>
            <p className="mt-10 text-[11px] md:text-xs text-black/60">
              Exact commercial terms depend on asset mix, utilisation, and existing infrastructure. Our team will shape
              a proposal around your portfolio.
            </p>
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
                  <Link href="/members" className="block hover:text-white transition-colors">
                    Members
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
