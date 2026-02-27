"use client";

import { useRouter } from "next/navigation";

export default function ScheduledRidesTerms() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Priroda usluge",
      content: "Rezervirana vožnja je usluga koja vam omogućuje da unaprijed zakažete termin preuzimanja. Payparq ne jamči da će vozač prihvatiti vaš zahtjev za vožnju, čak i ako je on uspješno zakazan u aplikaciji. Dostupnost ovisi o broju slobodnih vozača u trenutku zakazanog termina."
    },
    {
      title: "2. Vrijeme dolaska (ETA)",
      content: "Odabrano vrijeme je ciljano vrijeme preuzimanja. Zbog prometa, dostupnosti vozača ili drugih nepredviđenih okolnosti, vozač može doći do 15 minuta prije ili poslije zakazanog termina. Molimo budite spremni na adresi 5 minuta prije zakazanog vremena."
    },
    {
      title: "3. Naknade za otkazivanje",
      content: "Otkazivanje je besplatno do 60 minuta prije zakazanog termina. Ako otkažete vožnju manje od 60 minuta prije termina, ili ako se ne pojavite u roku od 5 minuta nakon dolaska vozača, Payparq zadržava pravo naplate naknade za otkazivanje u iznosu od 5,00 EUR."
    },
    {
      title: "4. Plaćanje i cijena",
      content: "Rezervirana vožnja plaća se odmah prilikom zakazivanja. Plaćanje je moguće izvršiti isključivo bankovnom karticom, Google Pay-om ili Apple Pay-om. Gotovina nije podržana za ovaj tip usluge. Konačna cijena može varirati ovisno o stvarnoj ruti i prometnim uvjetima."
    },
    {
      title: "5. Odgovornost",
      content: "Payparq nije odgovoran za bilo kakve gubitke, kašnjenja na letove, sastanke ili druge obveze proizašle iz nedostupnosti vozača ili kašnjenja u preuzimanju. Korištenjem ove usluge prihvaćate da je rizik kašnjenja na strani korisnika."
    }
  ];

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden fixed inset-0 z-[3000]">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full py-4 px-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
          >
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-[20px] font-normal tracking-tight">Uvjeti rezervacije</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-8 pb-10 custom-scrollbar">
          <div className="space-y-2">
            <h1 className="text-[24px] font-bold leading-tight uppercase tracking-tighter">Uvjeti rezerviranih vožnji</h1>
            <p className="text-[12px] text-black/40 font-normal">Posljednja izmjena: 27. veljače 2026.</p>
          </div>

          <div className="space-y-10">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-black/40">{section.title}</h3>
                <p className="text-[15px] font-normal leading-relaxed text-black/80">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-black/5">
            <p className="text-[13px] text-black/40 italic leading-relaxed">
              Nastavkom rezervacije potvrđujete da ste pročitali i prihvatili ove uvjete. Ovi uvjeti su sastavljeni u skladu s najboljim praksama industrije (Uber, Bolt, Lyft) kako bi se osigurala kvaliteta usluge i zaštita svih sudionika.
            </p>
          </div>
        </div>

        {/* Action Button removed as per user request */}
      </div>
    </div>
  );
}
