'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Car, Shield, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const handleDownloadReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <CheckCircle size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed</h1>
          <p className="text-white/60 text-sm">
            Your parking session has been successfully booked. 
            {sessionId && <span className="block mt-1 text-xs opacity-50 font-mono">Ref: {sessionId.slice(-8)}</span>}
          </p>
        </div>

        {/* Main Actions Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-6 no-print">
          
          {/* Upsell: Uber */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-white/80">
              <span>Next Steps</span>
            </div>
            
            <a 
              href="https://m.uber.com/ul" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[#000000] border border-white/10 hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                <Car size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Order Uber</h3>
                <p className="text-xs text-white/50">Get a ride to your terminal</p>
              </div>
              <ExternalLink size={16} className="text-white/30 group-hover:text-white transition-colors" />
            </a>

            {/* Upsell: Insurance */}
            <button 
              onClick={() => alert("Insurance added to your booking!")}
              className="w-full group relative flex items-center gap-4 p-4 rounded-2xl bg-[#5F3DFC]/10 border border-[#5F3DFC]/30 hover:bg-[#5F3DFC]/20 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#5F3DFC] text-white flex items-center justify-center shadow-lg shadow-[#5F3DFC]/20">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Add Insurance</h3>
                <p className="text-xs text-white/50">Protect your trip for €2.99</p>
              </div>
              <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-white transition-colors" />
              </div>
            </button>
          </div>

          <div className="h-px bg-white/10" />

          {/* Receipt Download */}
          <button 
            onClick={handleDownloadReceipt}
            className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
          >
            <Download size={16} />
            Download Receipt (PDF)
          </button>
        </div>

        {/* Back to Home */}
        <Link 
          href="/" 
          className="block text-center text-sm text-white/40 hover:text-white transition-colors no-print"
        >
          Return to Home
        </Link>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white; color: black; }
          .no-print { display: none !important; }
          /* Add specific print styling here if needed */
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05020A] text-white flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
