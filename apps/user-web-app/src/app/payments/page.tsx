'use client';

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";

export default function PaymentsPage() {
  const [plate, setPlate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState("");

  function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const plateVal = plate.trim();
    const locVal = locationId.trim();
    if (!plateVal || !locVal || !/^\d{5}$/.test(locVal)) {
      setError("Enter your license plate and a 5-digit location ID.");
      return;
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24 md:pt-28">
        <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            PayParq Payments
          </h1>
          <p className="text-sm md:text-base text-black/80 mb-8">
            View your parking notice and manage payments.
          </p>
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="License plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm md:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{5}"
                autoComplete="off"
                placeholder="Location ID (5 digits)"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value.replace(/\\D/g, "").slice(0, 5))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm md:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
              />
            </div>
            {error && (
              <div className="text-[#5F3DFC] text-xs md:text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#5F3DFC] text-white text-[12px] md:text-[13px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
            >
              Find My Parking Notice
            </button>
          </form>
        </section>

        <section className="bg-[#05020A] text-white border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-start">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                  Frequently Asked Questions
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                  Payments and Notices
                </h2>
                <div className="space-y-6 text-sm md:text-base text-white/80">
                  <div>
                    <p className="font-semibold mb-1">
                      I need help with my account, technical issues, or payments.
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
                    <p className="font-semibold mb-1">Where can I find my location ID?</p>
                    <p>
                      Check on-site signage. The location ID is a 5-digit number printed near the PayParq instructions.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">What if I entered the wrong plate or location ID?</p>
                    <p>
                      Re-enter your details above. If issues persist, contact{" "}
                      <a href="mailto:payparq@outlook.com" className="underline">
                        payparq@outlook.com
                      </a>
                      .
                    </p>
                  </div>
                </div>
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
