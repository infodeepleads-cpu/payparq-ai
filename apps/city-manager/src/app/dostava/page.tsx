import Link from "next/link";

export default function Dostava() {
  return (
    <main className="min-h-[100dvh] w-full bg-black text-white selection:bg-[#7C3AED]/30 overflow-x-hidden relative flex flex-col items-center">
      <div className="fixed inset-0 bg-black z-0 pointer-events-none" />
      <div className="sticky top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-black w-full" />
        <div className="h-32 bg-gradient-to-b from-black via-black/95 to-transparent w-full" />
      </div>

      <div className="w-full max-w-[430px] px-6 pb-2 -mt-[180px] relative z-[60] flex flex-col flex-1">
        <div className="flex items-center justify-between mb-10 h-11 relative">
          <div className="flex items-center gap-4 h-full">
            <div className="flex items-center justify-center w-9 h-9">
              <div className="h-7 w-7 rounded-[6px] bg-[#7C3AED] rotate-45 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-white/20 flex items-center justify-center" />
            </div>
            <Link href="/" prefetch={false} className="text-[28px] tracking-tight font-bold text-white leading-none flex items-center h-full ml-1.5 no-underline">parq</Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#1A162D] px-6 py-16 flex flex-col items-center justify-center gap-3 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.505 3.733 7.238.163.125.263.315.263.52v2.54a.444.444 0 0 0 .69.368l3.036-2.022a.89.89 0 0 1 .494-.148h1.784c5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2z" />
            </svg>
          </div>
          <div className="text-[22px] font-bold text-white tracking-tight">Dostava</div>
          <div className="text-[16px] font-medium text-white/80">Dolazi uskoro i u Vaš grad.</div>
        </div>

        <div className="flex-1" />

        <div className="mt-6 mb-2 pt-8 border-t border-white/10 w-full">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-[5px] bg-[#7C3AED] rotate-45 shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-white/20" />
            <div className="text-[20px] tracking-tight font-bold text-white leading-none">parq</div>
          </div>
          <div className="space-y-1 mt-2">
            <p className="text-[11px] text-white/30 tracking-wider">
              Sva prava pridržana © 2026 PayParq Global Inc.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-gradient-to-t from-black via-black/95 to-transparent w-full" />
        <div className="h-6 bg-black w-full" />
      </div>
    </main>
  );
}
