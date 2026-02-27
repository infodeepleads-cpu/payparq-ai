"use client";

import { Suspense } from "react";
import RideHailingWidget from "../../components/RideHailingWidget";
import Link from "next/link";

export default function SetLocationPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-black text-black uppercase tracking-tighter">Set Location</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Live Pricing</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-md mx-auto w-full bg-white shadow-2xl">
        <Suspense fallback={<div className="w-full h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>}>
          <RideHailingWidget />
        </Suspense>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto w-full p-6 text-center">
        <p className="text-[10px] text-black/40 font-medium uppercase tracking-[0.2em]">
          Powered by PayParq AI • Uber 2026 Strategy
        </p>
      </div>
    </main>
  );
}
