import React from "react";

export default function Page() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          3 KEY SOLUTIONS TO 3 BIGGEST PROBLEMS
        </h1>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">1️⃣ Zaustavljamo neautorizirana vozila</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  A) Mali objekti (Plava Naljepnica) – maknemo neovlaštene, gosti parkiraju besplatno, mi radimo sve.
                </li>
                <li>
                  B) Veći objekti (Safe Parking) – ulaz samo s autorizacijom (mobitel ili LPR), viša sigurnost i veća zarada.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">2️⃣ Manje gužve</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Punimo prazne lotove u blizini, pametni znakovi + taksi povratna vožnja.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">3️⃣ Veća zarada</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  Vidljivost: SEO, GEO, landing page, Google Maps &amp; Reviews
                </li>
                <li>
                  Konverzija: rezervacije + dinamičke cijene
                </li>
                <li>
                  Automatika: LPR (brži ulaz/izlaz, manji trošak)
                </li>
                <li>
                  Dodatno: osiguranje + taxi
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
