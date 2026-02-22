import React from "react";

export default function Page() {
  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-4 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">3 KEY SOLUTIONS TO 3 BIGGEST PROBLEMS</span>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">1. Zaustavljamo neautorizirana vozila</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
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
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">2. Manje gužve</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
              <p>Punimo prazne lotove u blizini, pametni znakovi + taksi povratna vožnja.</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">3. Veća zarada</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
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
