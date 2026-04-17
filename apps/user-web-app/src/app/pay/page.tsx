'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type FlowType = "park_now" | "monthly" | "reserve";

export default function PayPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FlowType>("park_now");
  const [locationId, setLocationId] = useState("");
  const [monthlyLocationId, setMonthlyLocationId] = useState("");
  const [processing, setProcessing] = useState<FlowType | null>(null);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [amountCentsHint, setAmountCentsHint] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("loc") || "";
    const inVal = params.get("in") || "";
    const outVal = params.get("out") || "";
    const amountCentsRaw = params.get("amount_cents") || "";
    const parsedAmountCents = Number.parseInt(amountCentsRaw, 10);
    const normalizedAmountCents =
      Number.isFinite(parsedAmountCents) && parsedAmountCents > 0 ? parsedAmountCents : null;
    const flowParam = params.get("flow");
    const flowFromParams: FlowType | null =
      flowParam === "park_now" || flowParam === "monthly" || flowParam === "reserve"
        ? flowParam
        : null;
    
    if (loc) {
      Promise.resolve().then(() => {
        setLocationId(loc);
        setMonthlyLocationId(loc);
        setCheckIn(inVal);
        setCheckOut(outVal);
        setAmountCentsHint(normalizedAmountCents);
        if (flowFromParams) {
          setActiveTab(flowFromParams);
          return;
        }
        if (inVal && outVal) setActiveTab("reserve");
      });
      return;
    }
    if (flowFromParams) {
      Promise.resolve().then(() => {
        setActiveTab(flowFromParams);
        setAmountCentsHint(normalizedAmountCents);
      });
      return;
    }
    Promise.resolve().then(() => {
      setAmountCentsHint(normalizedAmountCents);
    });
  }, []);

  const showWalletTopupExplainer =
    activeTab !== "monthly" && amountCentsHint !== null && amountCentsHint < 50;

  async function handleCheckout(flow: FlowType, location: string) {
    if (!location.trim()) {
      setError("Enter a location ID or name from on-site signage.");
      return;
    }

    setProcessing(flow);
    setError("");

    try {
      let customerEmail: string | undefined = undefined;
      let authToken: string | undefined = undefined;
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        customerEmail = data.session?.user?.email?.trim().toLowerCase() || undefined;
        authToken = data.session?.access_token || undefined;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          location_id: location.trim(),
          plate_number: "",
          customer_email: customerEmail,
          flow_type: flow,
          check_in: checkIn,
          check_out: checkOut,
        }),
      });

      if (!res.ok) {
        setError("Unable to start checkout. Please try again.");
        setProcessing(null);
        return;
      }

      const data = (await res.json().catch(() => null)) as { url?: string } | null;

      if (!data?.url) {
        setError("Checkout link not available. Please try again.");
        setProcessing(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(null);
    }
  }

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
                <div className="hidden md:flex items-center justify-center gap-7 text-[11px] uppercase tracking-[0.24em]">
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
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
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

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 text-black">
          <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">Payments</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Pay for parking with Payparq
          </h1>
          <p className="text-sm md:text-base text-black/70 mb-6">
            Enter the location code from on-site signage and choose whether you want to park now,
            subscribe monthly, or reserve parking.
          </p>

          <div className="inline-flex rounded-full border border-black/10 bg-black/5 p-1 text-[11px] font-semibold mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("park_now")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                activeTab === "park_now"
                  ? "bg-[#5F3DFC] text-white"
                  : "text-black/70 hover:bg-white"
              }`}
            >
              Park now
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                activeTab === "monthly"
                  ? "bg-[#5F3DFC] text-white"
                  : "text-black/70 hover:bg-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reserve")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                activeTab === "reserve"
                  ? "bg-[#5F3DFC] text-white"
                  : "text-black/70 hover:bg-white"
              }`}
            >
              Reserve
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {activeTab === "park_now" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!locationId.trim()) {
                  setError("Enter a location ID or name from on-site signage.");
                  return;
                }
                setError("");
                const now = new Date();
                const params = new URLSearchParams({
                  flow: "reserve",
                  type: "hourly",
                  loc: locationId.trim(),
                  in: now.toISOString(),
                  daily_footer: "1",
                });
                window.location.href = `/api/stripe/checkout?${params.toString()}`;
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-black/80">
                  Location ID
                </label>
                <input
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  placeholder="Enter location ID from signage"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC] focus:ring-offset-1 focus:ring-offset-white"
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
              >
                Pay Hourly
              </button>
            </form>
          )}

          {activeTab === "monthly" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckout("monthly", monthlyLocationId);
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-black/80">
                  Location ID
                </label>
                <input
                  type="text"
                  value={monthlyLocationId}
                  onChange={(e) => setMonthlyLocationId(e.target.value)}
                  placeholder="Enter location ID for your subscription"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC] focus:ring-offset-1 focus:ring-offset-white"
                />
              </div>
              <button
                type="submit"
                disabled={processing === "monthly"}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing === "monthly" ? "Redirecting…" : "Subscribe monthly"}
              </button>
            </form>
          )}

          {activeTab === "reserve" && (
            <div className="space-y-4">
              <p className="text-sm text-black/70">
                Browse available locations, pick your spot, and choose your arrival and
                departure times — then complete your reservation with a single tap.
              </p>
              <Link
                href="/locations"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
              >
                Browse locations
              </Link>
            </div>
          )}

          <div className="mt-10 border-t border-black/5 pt-6 text-xs text-black/70 space-y-1">
            <p>
              Need help with a payment or dispute? Visit{" "}
              <Link href="/support" className="underline">
                Support
              </Link>
              .
            </p>
            <p>
              For legal, privacy, and terms, visit{" "}
              <Link href="/legal" className="underline">
                Legal
              </Link>{" "}
              or see links below.
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
