import { FooterLocaleToggle } from "@/components/FooterLocaleToggle";

export function FooterBrand() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[10px] md:text-xs text-white/40 font-normal">
          © 2026 Payparq Global Inc.
        </div>
        <FooterLocaleToggle />
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
            <span className="text-xs md:text-sm font-semibold tracking-tight leading-none text-white">
              P
            </span>
          </div>
        </div>
        <div className="text-3xl md:text-5xl font-black tracking-tight text-white select-none">
          payparq
        </div>
      </div>
    </div>
  );
}
