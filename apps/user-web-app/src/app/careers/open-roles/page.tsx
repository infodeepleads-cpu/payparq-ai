"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";

export default function OpenRoles() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 bg-white/95 shadow-lg border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-14 md:h-16 grid grid-cols-3 items-center text-[11px] font-medium">
          <div className="flex items-center justify-start gap-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <Link href="/careers" className="hover:text-gray-700 transition-colors">Careers</Link>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/" className="relative flex items-center justify-center">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                  <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">P</span>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <a
              href="mailto:payparq@outlook.com?subject=Open%20roles%20inquiry"
              className="px-4 py-2 rounded-full border border-black/10 text-[11px] font-semibold hover:bg-black/5 transition-colors"
            >
              Contact recruiting
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">Careers</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Open roles</h1>
            <p className="text-sm md:text-base text-black/75">
              We’re hiring City Managers to lead operations in key coastal cities.
            </p>
          </div>
        </section>

        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">Operations</p>
                <h2 className="text-xl md:text-2xl font-semibold">City Manager — Dubrovnik</h2>
                <p className="text-xs md:text-sm text-black/70 mt-2">
                  Lead local deployments, partner success, and day-to-day operations across the Dubrovnik area.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="mailto:payparq@outlook.com?subject=Application%20%E2%80%94%20City%20Manager%20Dubrovnik"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-900 transition-colors"
                >
                  Apply via email
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">Operations</p>
                <h2 className="text-xl md:text-2xl font-semibold">City Manager — Makarska</h2>
                <p className="text-xs md:text-sm text-black/70 mt-2">
                  Lead local deployments, partner success, and day-to-day operations across the Makarska area.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="mailto:payparq@outlook.com?subject=Application%20%E2%80%94%20City%20Manager%20Makarska"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-900 transition-colors"
                >
                  Apply via email
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
