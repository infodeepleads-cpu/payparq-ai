import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full min-h-[100dvh] bg-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="mt-6">
          <h1 className="text-[20px] leading-tight text-black tracking-tight">PARQ INTELLIGENCE</h1>
          <p className="text-[12px] text-black/70 mt-1">Vaš osobni concierge</p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[11px] text-black/70">
          <span>Parking</span>
          <span className="opacity-30">•</span>
          <span>Vožnje</span>
          <span className="opacity-30">•</span>
          <span>Dostava</span>
        </div>
        <div className="mt-8">
          <Link
            href={{ pathname: "/", query: { show_chat: "1" } }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-[12px] tracking-tight"
          >
            Započni chat
          </Link>
          <Link
            href={{ pathname: "/map", query: { action: "locate" } }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-black text-black text-[12px] tracking-tight ml-2"
          >
            Lociraj se
          </Link>
        </div>
      </section>
    </main>
  );
}
