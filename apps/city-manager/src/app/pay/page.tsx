'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";

type FlowType = "park_now" | "monthly" | "reserve";

export default function PayPage() {
  const [activeTab, setActiveTab] = useState<FlowType>("park_now");
  const [locationId, setLocationId] = useState("");
  const [monthlyLocationId, setMonthlyLocationId] = useState("");
  const [reserveLocation, setReserveLocation] = useState("");
  const [processing, setProcessing] = useState<FlowType | null>(null);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("loc") || "";
    const inVal = params.get("in") || "";
    const outVal = params.get("out") || "";
    
    if (loc) {
      Promise.resolve().then(() => {
        setLocationId(loc);
        setMonthlyLocationId(loc);
        setReserveLocation(loc);
        setCheckIn(inVal);
        setCheckOut(outVal);
        if (inVal && outVal) {
          setActiveTab("reserve");
        }
      });
    }
  }, []);

  async function handleCheckout(flow: FlowType, location: string) {
    if (!location.trim()) {
      setError("Enter a location ID or name from on-site signage.");
      return;
    }

    setProcessing(flow);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: location.trim(),
          plate_number: "",
          customer_email: undefined,
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
                handleCheckout("park_now", locationId);
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-black/80">Location ID</label>
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
                disabled={processing === "park_now"}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing === "park_now" ? "Redirecting…" : "Pay now"}
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
                <label className="text-xs font-semibold text-black/80">Location ID</label>
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
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckout("reserve", reserveLocation);
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-black/80">Location name or ID</label>
                <input
                  type="text"
                  value={reserveLocation}
                  onChange={(e) => setReserveLocation(e.target.value)}
                  placeholder="Enter the location name or code you want to reserve"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC] focus:ring-offset-1 focus:ring-offset-white"
                />
              </div>
              <button
                type="submit"
                disabled={processing === "reserve"}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing === "reserve" ? "Redirecting…" : "Reserve parking"}
              </button>
            </form>
          )}

          <div className="mt-10 border-t border-black/5 pt-6 text-xs text-black/70 space-y-1">
            <p>
              Need help with a payment or dispute? Visit{" "}
              <Link href={{ pathname: "/support" }} className="underline">
                Support
              </Link>
              .
            </p>
            <p>
              For legal, privacy, and terms, visit{" "}
              <Link href={{ pathname: "/legal" }} className="underline">
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
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors">
                  <span className="text-xs">Download on the App Store</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Company
                  </p>
                  <Link href={{ pathname: "/about" }} className="block hover:text-white transition-colors">
                    About
                  </Link>
                  <Link href={{ pathname: "/careers" }} className="block hover:text-white transition-colors">
                    Careers
                  </Link>
                  <Link href={{ pathname: "/news" }} className="block hover:text-white transition-colors">
                    News
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Experience
                  </p>
                  <Link href={{ pathname: "/product" }} className="block hover:text-white transition-colors">
                    Product
                  </Link>
                  <Link href={{ pathname: "/parking" }} className="block hover:text-white transition-colors">
                    Parking
                  </Link>
                  <Link href={{ pathname: "/security" }} className="block hover:text-white transition-colors">
                    Security
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Policies
                  </p>
                  <Link href={{ pathname: "/legal" }} className="block hover:text-white transition-colors">
                    Legal
                  </Link>
                  <Link href={{ pathname: "/privacy" }} className="block hover:text-white transition-colors">
                    Privacy
                  </Link>
                  <Link href={{ pathname: "/terms" }} className="block hover:text-white transition-colors">
                    Terms
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Platform
                  </p>
                  <Link href={{ pathname: "/locations" }} className="block hover:text-white transition-colors">
                    Locations
                  </Link>
                  <Link href={{ pathname: "/members" }} className="block hover:text-white transition-colors">
                    Members
                  </Link>
                  <Link href={{ pathname: "/support" }} className="block hover:text-white transition-colors">
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
