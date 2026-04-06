'use client';

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";

export default function InsuranceApplyPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "config_error">("idle");
  const [phoneError, setPhoneError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setPhoneError("");
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    formData.set("source", "insurance_apply");
    const mobilePhone = (formData.get("mobile_phone") || "").toString().trim();
    const mobilePhonePattern = /^\+?[0-9()\-\s]{7,20}$/;
    if (!mobilePhonePattern.test(mobilePhone)) {
      setPhoneError("Unesite ispravan broj mobitela.");
      setStatus("idle");
      return;
    }
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.warning === "email_not_sent" || data.error?.includes("configuration missing")) {
          setStatus("config_error");
        } else {
          setStatus("error");
        }
        return;
      }
      setStatus("success");
      formElement.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.1fr,1fr] items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Osiguranje vozila
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-black">
                Aplicirajte za osiguranje za svoju rezervaciju
              </h1>
              <p className="text-sm md:text-base text-black/75 mb-4">
                Ispunite podatke o vozilu i rezervaciji. Naš tim će pregledati zahtjev i javiti vam se emailom.
              </p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-7 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
                Podaci za osiguranje
              </p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Ime</label>
                    <input type="text" required name="first_name" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Prezime</label>
                    <input type="text" required name="last_name" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Email</label>
                    <input type="email" required name="work_email" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Mobitel</label>
                    <input type="tel" required name="mobile_phone" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                    {phoneError ? <p className="mt-1 text-[11px] text-red-600">{phoneError}</p> : null}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Registracija vozila</label>
                    <input type="text" required name="license_plate" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Vozilo (marka i model)</label>
                    <input type="text" required name="vehicle_make_model" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Godina vozila</label>
                    <input type="number" min="1980" max="2100" name="vehicle_year" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Lokacija</label>
                    <input type="text" name="location_name" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">Vrsta pokrića</label>
                    <select name="coverage_type" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40">
                      <option value="">Odaberite</option>
                      <option value="basic">Osnovno</option>
                      <option value="extended">Prošireno</option>
                      <option value="full">Puno pokriće</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Napomena</label>
                  <textarea name="notes" rows={4} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40" />
                </div>
                {status === "success" ? (
                  <div className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#5F3DFC]/10 text-[#5F3DFC] text-xs font-semibold border border-[#5F3DFC]/20">
                    <span className="mr-2">✓</span> Zahtjev je uspješno poslan
                  </div>
                ) : (
                  <button type="submit" disabled={status === "submitting"} className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#5F3DFC] text-white text-xs font-semibold shadow-md hover:bg-[#4330c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {status === "submitting" ? "Šaljem..." : "Apliciraj"}
                  </button>
                )}
                {status === "error" && <p className="mt-2 text-xs text-red-600">Došlo je do greške. Pokušajte ponovno.</p>}
                {status === "config_error" && (
                  <p className="mt-2 text-xs text-red-600">
                    Zahtjev je zaprimljen, ali email servis nije konfiguriran.
                  </p>
                )}
              </form>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 md:px-12 pb-10">
            <Link href="/members" className="inline-flex items-center text-xs font-semibold text-black/70 hover:text-black">
              ← Povratak u Members
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Tvrtka</p>
              <Link href="/about" className="block hover:text-white transition-colors">O nama</Link>
              <Link href="/careers" className="block hover:text-white transition-colors">Karijere</Link>
              <Link href="/news" className="block hover:text-white transition-colors">Vijesti</Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Proizvod</p>
              <Link href="/product" className="block hover:text-white transition-colors">Proizvod</Link>
              <Link href="/parking" className="block hover:text-white transition-colors">Parking</Link>
              <Link href="/security" className="block hover:text-white transition-colors">Sigurnost</Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Pravno</p>
              <Link href="/legal" className="block hover:text-white transition-colors">Pravno</Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">Privatnost</Link>
              <Link href="/terms" className="block hover:text-white transition-colors">Uvjeti</Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platforma</p>
              <Link href="/locations" className="block hover:text-white transition-colors">Lokacije</Link>
              <Link href="/support" className="block hover:text-white transition-colors">Podrška</Link>
              <Link href="/members" className="block hover:text-white transition-colors">Članovi</Link>
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
