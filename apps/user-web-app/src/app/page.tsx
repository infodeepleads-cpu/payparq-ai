"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between text-[11px] font-medium text-black">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button className="hover:text-gray-700 transition-colors">
              Experience
            </button>
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('business')}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                Business
                <svg className={`w-2.5 h-2.5 transition-transform ${activeDropdown === 'business' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === 'business' && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 shadow-lg rounded-lg py-2 z-50">
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">Operators</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">Cities</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">Real Estate</button>
                </div>
              )}
            </div>
            <button className="hover:text-gray-700 transition-colors">
              Technology
            </button>
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('company')}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                Company
                <svg className={`w-2.5 h-2.5 transition-transform ${activeDropdown === 'company' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === 'company' && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 shadow-lg rounded-lg py-2 z-50">
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">About</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">Careers</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">Contact</button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xl font-black tracking-tighter shadow-lg transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                P
              </div>
              <span className="text-xl font-bold tracking-tighter font-plus-jakarta hidden sm:block">payparq<span className="text-[#5F3DFC]">.ai</span></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <button className="hidden sm:block px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors text-black">
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

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="px-4 py-6 space-y-4 text-black text-[13px] font-medium">
              <button className="block w-full text-left py-2 hover:text-gray-600">Experience</button>
              <div className="space-y-2">
                <button 
                  onClick={() => toggleDropdown('mobile-business')}
                  className="flex items-center justify-between w-full py-2 hover:text-gray-600"
                >
                  Business
                  <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'mobile-business' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'mobile-business' && (
                  <div className="pl-4 space-y-3 text-[12px] text-gray-600 border-l border-gray-100 ml-1">
                    <button className="block w-full text-left">Operators</button>
                    <button className="block w-full text-left">Cities</button>
                    <button className="block w-full text-left">Real Estate</button>
                  </div>
                )}
              </div>
              <button className="block w-full text-left py-2 hover:text-gray-600">Technology</button>
              <div className="space-y-2">
                <button 
                  onClick={() => toggleDropdown('mobile-company')}
                  className="flex items-center justify-between w-full py-2 hover:text-gray-600"
                >
                  Company
                  <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'mobile-company' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'mobile-company' && (
                  <div className="pl-4 space-y-3 text-[12px] text-gray-600 border-l border-gray-100 ml-1">
                    <button className="block w-full text-left">About</button>
                    <button className="block w-full text-left">Careers</button>
                    <button className="block w-full text-left">Contact</button>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <button className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center font-semibold">
                  Get in Touch
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black text-white text-[10px] md:text-[11px] text-center py-2 px-4 line-clamp-1">
          <span className="font-semibold">payparq.ai</span> secures smarter parking portfolios with real-time recognition
        </div>
      </header>

      <main className="flex-1 pt-[104px] md:pt-[96px] bg-white">
        <section className="relative min-h-[85vh] md:min-h-[90vh] overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 scale-105 hover:scale-100"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=2500&q=100')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
          </div>
          <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 flex items-center min-h-[85vh] md:min-h-[90vh]">
            <div className="max-w-2xl mb-12 md:mb-0 text-black">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5F3DFC] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5F3DFC]"></span>
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/80">
                  Global Access Layer
                </p>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 font-plus-jakarta">
                payparq.ai makes cities <span className="text-[#5F3DFC]">move with you</span>
              </h1>
              <p className="text-lg md:text-xl text-black/70 mb-10 leading-relaxed font-medium max-w-xl">
                The world’s first mobile software-only platform for frictionless urban mobility
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
                <button className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-black text-white text-sm font-bold shadow-2xl hover:bg-gray-900 transition-all active:scale-95 group">
                  <span>Start Experience</span>
                  <div className="w-6 h-6 rounded-full bg-[#5F3DFC] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                <button className="px-10 py-5 rounded-full border-2 border-black/10 text-sm font-bold text-black hover:bg-black/5 transition-all text-center">
                  Partner with us
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="grid gap-16 md:grid-cols-[1.5fr,1fr] items-start">
              <div className="max-w-xl">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-white/50 mb-6">
                  For drivers, operators, and cities
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold mb-6 leading-tight">
                  Frictionless access to anywhere you want to be
                </h2>
                <p className="text-sm md:text-base text-white/60 mb-8 leading-relaxed">
                  From mixed-use garages to open-air lots, payparq turns any space into a
                  seamless, app-free arrival experience while unlocking new revenue.
                </p>
                <button className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5,12c0,0.5-0.1,1-0.3,1.5c-0.5,1.4-1.9,2.4-3.5,2.4c-2.1,0-3.8-1.7-3.8-3.8c0-2.1,1.7-3.8,3.8-3.8c1.6,0,3,1,3.5,2.4 C17.4,11,17.5,11.5,17.5,12z M22,12c0,5.5-4.5,10-10,10S2,17.5,2,12S6.5,2,12,2S22,6.5,22,12z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Download on the</p>
                    <p className="text-sm font-semibold">App Store</p>
                  </div>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Company</p>
                  <div className="flex flex-col gap-3 text-[12px] text-white/50">
                    <button className="text-left hover:text-white transition-colors">About</button>
                    <button className="text-left hover:text-white transition-colors">Careers</button>
                    <button className="text-left hover:text-white transition-colors">News</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Experience</p>
                  <div className="flex flex-col gap-3 text-[12px] text-white/50">
                    <button className="text-left hover:text-white transition-colors">Product</button>
                    <button className="text-left hover:text-white transition-colors">Parking</button>
                    <button className="text-left hover:text-white transition-colors">Aviation</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Policies</p>
                  <div className="flex flex-col gap-3 text-[12px] text-white/50">
                    <button className="text-left hover:text-white transition-colors">Legal</button>
                    <button className="text-left hover:text-white transition-colors">Privacy</button>
                    <button className="text-left hover:text-white transition-colors">Terms</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Platform</p>
                  <div className="flex flex-col gap-3 text-[12px] text-white/50">
                    <button className="text-left hover:text-white transition-colors">API</button>
                    <button className="text-left hover:text-white transition-colors">Partners</button>
                    <button className="text-left hover:text-white transition-colors">Support</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-24 pt-12 border-t border-white/5 relative overflow-hidden">
              <div className="text-[15vw] font-black tracking-tighter text-white/[0.03] select-none leading-none -mb-8 uppercase">
                payparq
              </div>
              <div className="absolute bottom-12 right-0 flex gap-6 text-white/20">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:text-white hover:border-white transition-all cursor-pointer">𝕏</div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:text-white hover:border-white transition-all cursor-pointer">in</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#05020A]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] text-white/40">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
            <span>© {new Date().getFullYear()} payparq.ai Technologies, Inc.</span>
            <span className="hidden md:inline-block opacity-30">•</span>
            <span className="max-w-[200px] md:max-w-none">
              Frictionless access to anywhere you want to be
            </span>
          </div>
          <div className="flex items-center gap-8">
            <button className="hover:text-white transition-colors">Status</button>
            <button className="hover:text-white transition-colors">Contact</button>
            <button className="hover:text-white transition-colors">Site Map</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
