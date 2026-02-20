import React from 'react';

export default function ReviewManagementPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          Experience Excellence — Ops Guidelines
        </h1>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">1. Outperform Expectations</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Every guest interaction should feel effortless and superior</li>
                <li>Solve problems before they notice them</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">2. Immaculate Presentation</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Drivers always impeccably dressed</li>
                <li>Vehicles clean and well-maintained</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">3. Spotless Lot</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>No debris, damage, or wear</li>
                <li>All suspicious or unsafe areas eliminated</li>
                <li>Clear signage & lighting</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">4. Surprise & Delight</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Add a physical “wow” element per guest visit:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Unique touchpoint that guests remember</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">5. Continuous Audit</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Daily inspections for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Lot condition</li>
                <li>Driver & partner presentation</li>
                <li>Guest experience touchpoints</li>
              </ul>
              <p className="mt-4 font-semibold text-black">Any deviation → correct immediately</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">6. Feedback</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Respond to feedback urgently and instantly</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
