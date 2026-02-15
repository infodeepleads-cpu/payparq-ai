'use client';

import React from 'react';
import { CheckCircle, Clock, CreditCard, History, ChevronRight } from 'lucide-react';
import MapboxPlaceholder from '@/components/MapboxPlaceholder';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col md:flex-row">
      {/* Sidebar / History (Collapsible on mobile) */}
      <aside className="w-full md:w-80 bg-surface border-r border-white/10 p-6 flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold">P</div>
          <span className="font-bold text-lg tracking-tight">PAYPARQ.AI</span>
        </div>

        <h3 className="text-xs font-bold text-white/50 uppercase mb-4 flex items-center gap-2">
          <History size={14} />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/20 p-3 rounded border border-white/5 hover:bg-black/30 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold">Zone A-12</span>
                <span className="text--[10px] text-white/50">Oct {20 - i}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-white/70">2h 15m</span>
                <span className="text-xs font-mono text-green-400">$8.50</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-lg">
          
          {/* Success Card */}
          <div className="bg-surface border border-primary/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-400" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                <CheckCircle size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Session Validated</h1>
              <p className="text-white/60">Your parking session is active and verified.</p>
            </div>

            {/* Map Placeholder */}
            <MapboxPlaceholder locationId="mock-loc-id" />

            {/* Session Details */}
            <div className="bg-black/20 rounded-xl p-6 mb-6 space-y-4 border border-white/5">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-white/50 text-sm">License Plate</span>
                <span className="font-mono text-xl font-bold tracking-wider">ABC-123</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Time Remaining</span>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Clock size={16} />
                  <span className="font-mono text-lg font-bold">01:45:00</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/25 group">
              <CreditCard size={20} />
              Extend Session
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-center text-[10px] text-white/30 mt-4">
              Powered by Stripe Secure Payment
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
