import React from 'react';

export default function ReviewManagementPage() {
  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 py-4 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">Outperform Expectations</span>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">1. Entry</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Date</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">2. Live DEMO</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Date</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">3. Yes Date</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Expiration date if contract</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">4. No Date</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Reason/Improvement</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">5. Follow Up Date</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Date</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
