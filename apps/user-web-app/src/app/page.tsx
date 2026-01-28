import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="w-full border-b border-white/10 bg-black/70 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#5F59FF] flex items-center justify-center text-xs font-black">
              P
            </div>
            <span className="text-sm font-black tracking-tight">
              payparq<span className="text-[#5F59FF]">.ai</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-white/60">
            <button className="hover:text-white transition-colors">
              Platform
            </button>
            <button className="hover:text-white transition-colors">
              Solutions
            </button>
            <button className="hover:text-white transition-colors">
              Customers
            </button>
            <button className="hover:text-white transition-colors">
              Company
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex text-xs font-semibold text-white/70 hover:text-white transition-colors">
              Talk to sales
            </button>
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        <section className="relative min-h-[640px] flex items-center">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
            <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-[#5F59FF]/40 blur-[120px]" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-xl space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5F59FF]" />
                Artificial intelligence for parking
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9]">
                Artificial intelligence
                <br />
                <span className="text-white/60">for the real world.</span>
              </h1>
              <p className="text-sm md:text-base text-white/60 max-w-md">
                payparq.ai uses computer vision and data to operate parking with
                zero gates, zero tickets, and zero hardware on site.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#5F59FF] text-sm font-bold hover:scale-[1.02] transition-transform"
                >
                  Get started
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white/5 border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                  Talk to our team
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-md w-full">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
                      Live session
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/80">
                      Downtown Garage • Zone A-12
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-green-300">
                      Active
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.18em]">
                      Vehicle
                    </p>
                    <p className="text-xl font-black tracking-widest">
                      ABC 123
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.18em]">
                      Duration
                    </p>
                    <p className="text-xl font-semibold text-white/90">
                      2h 15m
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.18em]">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-white/80">
                      payparq.ai • P-0241
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.18em]">
                      Current total
                    </p>
                    <p className="text-xl font-black text-white">$8.50</p>
                  </div>
                </div>
                <button className="w-full mt-2 rounded-2xl bg-white text-black text-sm font-bold py-3 hover:bg-gray-200 transition-colors">
                  Open customer dashboard
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-black">
          <div className="max-w-7xl mx-auto px-6 py-16 space-y-10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div className="space-y-3 max-w-md">
                <p className="text-[10px] font-semibold text-[#5F59FF] uppercase tracking-[0.2em]">
                  Why payparq.ai
                </p>
                <h2 className="text-2xl md:text-3xl font-black">
                  Software-only parking with no gates, no tickets, no friction.
                </h2>
                <p className="text-sm text-white/60">
                  We replace traditional parking hardware with computer vision,
                  advanced analytics, and a fully digital customer experience.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full md:max-w-xl">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-[0.18em]">
                    Compliance
                  </p>
                  <p className="text-lg font-bold">License plate first</p>
                  <p className="text-xs text-white/60">
                    Every vehicle is captured and validated using AI-powered
                    scanning.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-[0.18em]">
                    Revenue
                  </p>
                  <p className="text-lg font-bold">Dynamic pricing</p>
                  <p className="text-xs text-white/60">
                    Optimize pricing by time, demand, and location with no
                    manual updates.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-[0.18em]">
                    Experience
                  </p>
                  <p className="text-lg font-bold">App-free entry</p>
                  <p className="text-xs text-white/60">
                    Drivers just park and go. No tickets, no kiosks, no
                    downloads.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-[0.18em]">
                  Occupancy
                </p>
                <p className="mt-2 text-3xl font-black">98%</p>
                <p className="mt-1 text-xs text-green-400">
                  Optimized across downtown portfolio
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-[0.18em]">
                  Uplift
                </p>
                <p className="mt-2 text-3xl font-black">+22%</p>
                <p className="mt-1 text-xs text-white/60">
                  Average revenue per space compared to gated systems
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-[0.18em]">
                  Coverage
                </p>
                <p className="mt-2 text-3xl font-black">24/7</p>
                <p className="mt-1 text-xs text-white/60">
                  Real-time monitoring and enforcement ready
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>© {new Date().getFullYear()} payparq.ai</span>
            <span className="hidden md:inline-block">•</span>
            <span className="hidden md:inline-block">
              Artificial intelligence for parking
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <button className="hover:text-white transition-colors">
              Privacy
            </button>
            <button className="hover:text-white transition-colors">
              Terms
            </button>
            <button className="hover:text-white transition-colors">
              Status
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
