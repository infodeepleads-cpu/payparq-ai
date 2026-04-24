"use client";

import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";

export default function News() {

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
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
            <div className="mb-8">
              <div className="max-w-xl mx-auto text-center">
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
                href="/news/blog/parking-aerodrom-split"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Vodič — Aerodrom Split, Hrvatska
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Parking Aerodrom Split: Gdje Parkirati kod SPU od €0.50/sat
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Kompletni vodič za parkiranje kod splitskog aerodroma — PayParq parking 2–3 km od terminala s shuttle uslugom i rezervacijom online.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Pročitaj →
                </div>
              </Link>

              <Link
                href="/news/blog/parking-trogir"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Vodič — Trogir, Hrvatska
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Parking Trogir: Gdje Parkirati uz UNESCO Stari Grad
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Park&Ride rješenje za posjetitelje Trogira — 800m od ulaza u stari grad, od €0.90/sat, bez tiketa, AI kamere 24/7.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Pročitaj →
                </div>
              </Link>

              <Link
                href="/news/blog/parking-baska-voda-punta-rata"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Vodič — Makarska Riviera, Hrvatska
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Parking Baška Voda i Plaža Punta Rata — Sezonski Vodič
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Gdje parkirati uz jednu od najljepših plaža Europe — savjeti, cijene i PayParq lokacija kod Punta Rate na Makarskoj Rivieri.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Pročitaj →
                </div>
              </Link>

              <Link
                href="/news/blog/smart-parking-hrvatska-2025"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Technology — Croatia
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Smart Parking Croatia 2025: No Tickets, No Apps, No Barriers
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    How PayParq's AI camera platform is transforming parking across Croatia — from Split Airport to Trogir and the Makarska Riviera.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Read post →
                </div>
              </Link>

              <Link
                href="/news/blog/parking-dalmacija-ljeto-2025"
                className="group rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                    Vodič — Dalmacija, Hrvatska
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-black mb-2">
                    Parking u Dalmaciji — Ljeto 2025: Potpuni Vodič
                  </h3>
                  <p className="text-xs md:text-sm text-black/70">
                    Split, Trogir, Makarska, Dubrovnik — sve što trebate znati o parkiranju na Jadranu ove sezone. 10 savjeta i pregled PayParq lokacija.
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-black/60 group-hover:text-black/80">
                  Pročitaj →
                </div>
              </Link>

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

