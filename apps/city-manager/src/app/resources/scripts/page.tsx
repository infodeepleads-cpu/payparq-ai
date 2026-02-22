import React from 'react';

export default function ScriptsPage() {
  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-2 md:px-0 py-4 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">Personalized Outreach Framework</span>
        </div>
        
        <div className="mb-10 text-sm text-gray-800 leading-relaxed">
          <p className="mb-4">
            Must be written personally for each customer — this is about relationship depth, not automation.
          </p>
          <p className="font-medium italic border-l-4 border-black pl-4 py-2 bg-gray-50 text-xs">
            Doing this work manually for each guest changes how you think about sales: it builds trust, deepens engagement, and increases the likelihood of successful deal.
          </p>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">1. Reference Personalized Situation (1 sentence)</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p>Acknowledge the guest’s unique context or experience.</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">2. Present Solution (1 sentence)</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p>State the fix confidently.</p>
              <p className="mt-2 font-semibold">Attitude: “This is a fix, not a suggestion.”</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">3. Ask for Time/Date Meet-Up (1 sentence)</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p>Schedule a follow-up call or meeting to confirm the solution.</p>
              <p className="mt-2 font-semibold">Attitude: professional, confident, action-oriented.</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Follow-Up: Same day always</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p>Send a personalized handwritten or AI-assisted PDF note thanking the guest and presenting all relevant info with links.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
