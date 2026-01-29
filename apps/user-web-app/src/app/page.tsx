import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center items-start pointer-events-none font-apple-ui">
        <div className="w-full max-w-sm md:max-w-[960px] px-4 md:px-20 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-6 text-[11px] font-medium text-black">
              <div className="flex items-center gap-4">
                <button className="md:hidden flex flex-col justify-center gap-[3px]">
                  <span className="h-[1.5px] w-4 bg-black" />
                  <span className="h-[1.5px] w-4 bg-black" />
                </button>
                <div className="hidden md:flex items-center gap-6">
                  <button className="hover:text-gray-700 transition-colors">
                    Experience
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    Business
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    Technology
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    Company
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-gradient-to-br from-zinc-800 to-black text-white flex items-center justify-center text-sm md:text-base font-bold tracking-tighter border border-white/10 shadow-lg ring-1 ring-black/5">
                  P
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-3">
                <button className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors">
                  Get in Touch
                </button>
                <Link
                  href="/pay"
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Pay Now
                </Link>
              </div>
            </div>
            <div className="bg-black text-white text-[10px] md:text-[11px] text-center py-2 px-4">
              <span className="font-semibold">Payparq</span> powers smarter parking across Europe
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white">
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/5847385/pexels-photo-5847385.jpeg?auto=compress&cs=tinysrgb&w=1920')",
              }}
            />
            <div className="absolute inset-0 bg-white/5" />
            <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-gradient-to-br from-[#5F3DFC]/10 via-transparent to-transparent opacity-80 blur-3xl -translate-y-1/3 translate-x-1/5 pointer-events-none" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto px-6 flex items-center md:items-end justify-center md:justify-start min-h-screen pt-32 md:pt-0">
            <div className="max-w-md mb-12 md:mb-24 text-black text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-semibold md:font-bold tracking-tight leading-tight mb-6">
                payparq makes cities{" "}
                <span className="text-[#5F3DFC]">move with you</span>
              </h1>
              <p className="text-base md:text-lg text-black/70 mb-8 max-w-xl mx-auto md:mx-0">
                The world’s first mobile software-only platform for frictionless urban mobility.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-800 transition-colors">
                  <span>Discover How</span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#5F3DFC] to-[#FF5CF5] flex items-center justify-center text-white text-[10px]">
                    →
                  </span>
                </button>
                <button className="px-5 py-2.5 rounded-full border border-black/25 text-[11px] font-semibold text-black/85 hover:border-black/60 hover:text-black transition-colors">
                  For operators and cities
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                  For drivers, operators, and cities
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">
                  Frictionless access to anywhere you want to be
                </h2>
                <p className="text-sm text-white/70 mb-6 max-w-md">
                  From mixed-use garages to open-air lots, payparq turns any space into a
                  seamless, app-free arrival experience while unlocking new revenue.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors">
                  <span className="text-xs">Download on the App Store</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Company
                  </p>
                  <button className="block hover:text-white transition-colors">About</button>
                  <button className="block hover:text-white transition-colors">Careers</button>
                  <button className="block hover:text-white transition-colors">News</button>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Experience
                  </p>
                  <button className="block hover:text-white transition-colors">Product</button>
                  <button className="block hover:text-white transition-colors">Parking</button>
                  <button className="block hover:text-white transition-colors">Aviation</button>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Policies
                  </p>
                  <button className="block hover:text-white transition-colors">Legal</button>
                  <button className="block hover:text-white transition-colors">Privacy</button>
                  <button className="block hover:text-white transition-colors">Terms</button>
                  <button className="block hover:text-white transition-colors">
                    California Privacy
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                    Platform
                  </p>
                  <button className="block hover:text-white transition-colors">API</button>
                  <button className="block hover:text-white transition-colors">Partners</button>
                  <button className="block hover:text-white transition-colors">Support</button>
                </div>
              </div>
            </div>
            <div className="mt-16 text-5xl md:text-7xl font-black tracking-tight text-white/5 select-none">
              payparq
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/60">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} payparq</span>
            <span className="hidden md:inline-block">•</span>
            <span className="hidden md:inline-block">
              Frictionless access to anywhere you want to be
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-white transition-colors">Status</button>
            <button className="hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
