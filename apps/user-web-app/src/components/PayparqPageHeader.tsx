'use client';

import { ChevronLeft } from 'lucide-react';

interface PayparqPageHeaderProps {
  title: string;
  onBack: () => void;
  lineColor?: 'violet' | 'black';
}

export function PayparqPageHeader({ title, onBack, lineColor = 'violet' }: PayparqPageHeaderProps) {
  const lineClass = lineColor === 'black' ? 'border-black/20' : 'border-[#5F3DFC]';

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div className={`px-4 py-4 md:py-5 md:px-6 border-b-2 ${lineClass}`}>
        <div className="flex items-center justify-between">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-xs font-semibold tracking-tight leading-none text-white">
                  P
                </span>
              </div>
            </div>
            <div className="text-lg font-black tracking-tight text-black select-none">
              payparq
            </div>
          </div>

          {/* MIDDLE: Title */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h1>

          {/* RIGHT: Back button */}
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
