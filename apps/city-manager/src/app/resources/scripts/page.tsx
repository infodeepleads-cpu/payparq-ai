import React from 'react';

export default function ScriptsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          Scripts
        </h1>
        
        <div className="mb-10 text-gray-700 leading-relaxed text-sm">
          <p className="mb-4">
            Must be written personally for each customer — this is about relationship depth, not automation.
          </p>
          <p className="font-medium italic border-l-4 border-black pl-4 py-2 bg-gray-50">
            Doing this work manually for each guest changes how you think about sales: it builds trust, deepens engagement, and increases the likelihood of successful deal.
          </p>
        </div>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">1. Reference Personalized Situation (1 sentence)</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Acknowledge the guest’s unique context or experience.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">2. Present Solution (1 sentence)</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>State the fix confidently.</p>
              <p className="mt-2 text-gray-900 font-semibold">Attitude: “This is a fix, not a suggestion.”</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">3. Ask for Time/Date Meet-Up (1 sentence)</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Schedule a follow-up call or meeting to confirm the solution.</p>
              <p className="mt-2 text-gray-900 font-semibold">Attitude: professional, confident, action-oriented.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Follow-Up: Same day always</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              <p>Send a personalized handwritten or AI-assisted PDF note thanking the guest and presenting all relevant info with links.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
