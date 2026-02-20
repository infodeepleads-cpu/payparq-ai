import React from 'react';

export default function ReviewManagementPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          Outperform Expectations
        </h1>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">1. Entry</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Date</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">2. Live DEMO</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Date</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">3. Yes Date</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Expiration date if contract</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">4. No Date</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Reason/Improvement</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">5. Follow Up Date</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
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
