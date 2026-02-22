import React from 'react';

export default function OpsMasteryPage() {
  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-5 md:px-0 py-4 overflow-x-hidden pr-6">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">Non-Negotiables</span>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Immediate Action</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Every push = immediate solution</li>
                <li>No delays, no callbacks, no excuses</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Uptime & Reliability</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>100% uptime is the standard</li>
                <li>A stranded guest is unacceptable — this must never happen</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Response Time SLAs</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Max 5 minutes ride waiting</li>
                <li>Reservation issues resolved within 15 minutes</li>
                <li>Return ride maximum 15 minutes</li>
                <li>Same-day technician arrival required</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Guest First Doctrine</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The guest is always right</li>
                <li>If a guest asks for a refund → refund immediately</li>
                <li>De-escalate first, always</li>
                <li>Be discreet, calm, and professional</li>
                <li>Avoid conflict — never farm fines</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Partners & Accountability</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Only work with top-tier partners</li>
                <li>Taxi Head is the most important partner</li>
                <li>Must have trained agents</li>
                <li>Must pass full company vetting, even if personally chosen</li>
                <li>If reviews drop or uptime fails → switch immediately</li>
              </ul>
              <p className="mt-4 font-semibold">Same rule applies to technicians:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>No-show = no more work</li>
                <li>Zero tolerance for unreliability</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">HUB Launch</h2>
            <div className="text-sm text-gray-800 leading-relaxed">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Reviews</li>
                <li>Testing / On Site Marketing / Allow Taxis to use the Lot</li>
                <li>Feedback</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Core Principle</h2>
            <p className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-black pl-4 py-2">
              There is nothing worse than a stranded guest. 
              <br />
              Ops exist to ensure this never happens.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
