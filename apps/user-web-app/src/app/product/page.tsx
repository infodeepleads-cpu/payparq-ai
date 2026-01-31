 'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown, Camera } from "lucide-react";

export default function Product() {
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
                  <Link href="/product" className="hover:text-gray-900 transition-colors font-semibold">
                    Product
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
                  <Link
                    href="/product"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Product
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
        <section className="relative overflow-hidden bg-[#05020A] text-white">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-[#020617] via-[#020617] to-[#111827]" />
            <div className="absolute inset-0 opacity-30">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 0% 0%, rgba(94,234,212,0.35) 0, transparent 45%), radial-gradient(circle at 90% 100%, rgba(129,140,248,0.35) 0, transparent 50%)",
                }}
              />
            </div>
          </div>
          <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-[1.3fr,1fr] items-center">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                  iPhone-powered Mobile LPR
                </p>
                <h1 className="text-3xl md:text-5xl font-semibold md:font-bold tracking-tight leading-tight mb-4">
                  Point your phone. We handle every plate.
                </h1>
                <p className="text-sm md:text-base text-white/75 mb-6">
                  Payparq runs Mobile License Plate Recognition directly on iPhone, capturing plates as patrols move
                  through the city and turning every photo into a live parking session.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold shadow-md hover:bg-gray-100 transition-colors">
                    <span>Watch LPR in action</span>
                  </button>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-xs font-semibold hover:bg-white/5 transition-colors">
                    <span>Talk to Sales</span>
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Plates captured in real time as patrols drive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>No fixed cameras or gates required</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex justify-end">
                <div className="relative">
                  <div className="absolute -top-6 -left-6 h-16 w-16 rounded-full bg-emerald-400/20 blur-2xl" />
                  <div className="absolute -bottom-8 -right-4 h-20 w-20 rounded-full bg-indigo-400/25 blur-2xl" />
                  <div className="relative mx-auto w-64 rounded-[32px] border border-white/15 bg-white/5 p-2 shadow-[0_30px_80px_rgba(15,23,42,0.8)]">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/40" />
                    <div className="overflow-hidden rounded-[24px] bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617] border border-white/10">
                      <div className="flex items-center justify-between px-4 py-3 text-[10px] text-white/70">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 border border-emerald-300/40">
                            <Camera className="h-3 w-3 text-emerald-300" />
                          </div>
                          <span className="font-medium tracking-[0.16em] uppercase">LPR capture</span>
                        </div>
                        <span className="text-white/40">iPhone</span>
                      </div>
                      <div className="px-4 pb-4 pt-2 space-y-3">
                        <div className="rounded-2xl bg-black/60 border border-white/10 px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Plate</p>
                            <p className="font-mono text-lg tracking-[0.28em] text-white">ZG 123-PP</p>
                          </div>
                          <div className="text-right text-[10px] text-emerald-300">
                            <p className="uppercase tracking-[0.18em]">Matched</p>
                            <p className="text-white/60">Zone A • 02:14</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[10px] text-white/60">
                          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                            <p className="uppercase tracking-[0.2em] text-white/40 mb-1">Session</p>
                            <p className="font-mono text-xs text-white">Active • $3.40</p>
                          </div>
                          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                            <p className="uppercase tracking-[0.2em] text-white/40 mb-1">Confidence</p>
                            <p className="font-mono text-xs text-emerald-300">99.2%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Seamless. Simple. Built for drivers.
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  One profile. Effortless parking across your entire network.
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-4">
                  With Payparq, drivers connect a vehicle once and instantly get access to every participating lot,
                  garage, and on-street zone. Visits start automatically on arrival and end when the vehicle leaves.
                </p>
                <ul className="space-y-2 text-xs md:text-sm text-black/75">
                  <li>License plate recognition starts and stops sessions automatically.</li>
                  <li>Clear SMS receipts keep drivers informed without needing an app.</li>
                  <li>No gates, tickets, or payment hardware required on site.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#05020A] text-white p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/60 mb-2">
                  For your customers
                </p>
                <p className="text-sm md:text-base text-white/80 mb-3">
                  A modern journey that fits into the rest of their digital life. Drivers stay focused on where they are
                  going, not how to pay for parking.
                </p>
                <div className="mt-4 grid gap-3 text-xs md:text-sm text-white/80">
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <p>Automatic sessions on entry and exit with accurate timing.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <p>Secure, tokenized payments that can be reused across sites.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <p>Instant digital receipts with location, duration, and price.</p>
                  </div>
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
            <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm text-white/80">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">
                  Real estate owners
                </p>
                <p>
                  Standardized digital revenue collection across assets, with live visibility into occupancy and yield.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">Drivers</p>
                <p>
                  A consistent, predictable way to park at the curb, in garages, and in surface lots without extra
                  steps.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">Building tenants</p>
                <p>
                  Digital validations and guest access tools replace hang tags and spreadsheets with a clean portal.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">Property managers</p>
                <p>
                  A single dashboard to manage pricing, allocations, exceptions, and performance across properties.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">Local operations</p>
                <p>
                  Mobile tools show live utilization and guide teams to where patrols, valet, or support are needed most.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-1">Local businesses</p>
                <p>
                  Seamless digital validations keep spaces available for customers while still protecting the asset.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Reshaping parking economics
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Fewer hardware contracts. More software-driven NOI.
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-4">
                  Payparq replaces legacy meters, gates, and fragmented enforcement systems with a single, cloud-first
                  stack. You unlock better revenue capture while reducing CapEx and operating complexity.
                </p>
                <ul className="space-y-2 text-xs md:text-sm text-black/75">
                  <li>Remove redundant equipment while keeping or improving coverage.</li>
                  <li>Standardize policies and pricing across every bay in the portfolio.</li>
                  <li>Feed occupancy and demand data straight into asset reporting.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-6 text-xs md:text-sm text-black/80">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  CapEx down, NOI up
                </p>
                <p className="mb-3">
                  Instead of buying more hardware every time a site changes, Payparq scales with software. New zones and
                  rules are configured centrally and pushed live in hours, not months.
                </p>
                <p>
                  That means fewer surprises in the budget and a clearer link between curb performance and investor
                  outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] text-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  Actionable analysis
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Insights that explain how every space is being used.
                </h2>
                <p className="text-sm md:text-base text-white/80 mb-4">
                  Payparq connects sessions, plates, and enforcement outcomes into a single dataset so you can see what
                  is happening — not just how many tickets were written.
                </p>
                <ul className="space-y-2 text-xs md:text-sm text-white/80">
                  <li>Understand dwell time, turnover, and repeat behavior at each site.</li>
                  <li>Compare performance across neighborhoods, asset types, and time of day.</li>
                  <li>Use data to make the case for pricing, policy, and capital decisions.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-xs md:text-sm text-white/85">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  Built for operators
                </p>
                <p className="mb-3">
                  The same platform that powers driver sessions also drives dashboards and reports for your team, so no
                  one is working from stale exports.
                </p>
                <p>
                  Real-time views of occupancy and enforcement let you adjust staffing and strategy before problems
                  show up in monthly numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 border-t border-black/5">
            <div className="grid gap-8 md:grid-cols-[1.5fr,1fr] items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Ready to see Payparq in action?
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Bring seamless, software-led parking to your portfolio.
                </h2>
                <p className="text-sm md:text-base text-black/75 mb-5">
                  Share a few details about your assets and our team will follow up with a tailored walkthrough of how
                  Payparq could work across your locations.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors">
                    <span>Book a demo</span>
                  </button>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 text-xs font-semibold hover:bg-black/5 transition-colors">
                    <span>Download product overview</span>
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-6 text-xs md:text-sm text-black/80">
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2">
                  For investors and partners
                </p>
                <p className="mb-3">
                  Payparq is designed to work at the scale of cities and portfolios, not just single garages. One
                  product roadmap powers every new deployment.
                </p>
                <p>
                  That means faster launches, more consistent operations, and a clearer story about how parking supports
                  the rest of your strategy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterBrand />
    </div>
  );
}
