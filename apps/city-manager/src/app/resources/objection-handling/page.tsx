import React from 'react';

export default function ObjectionHandlingPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          Common Objections (and How We Answer Them)
        </h1>
        
        <div className="space-y-12">
          {/* Objections Section */}
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #1: “Is this legal?”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Short answer:</span> Yes — fully legal.</p>
                <p className="font-semibold mt-2">How to respond (verbatim-safe):</p>
                <p>We operate as a private parking company. All operational risk, enforcement costs, and liability are entirely ours, not the owner’s.</p>
                <p>Under Croatian law, private parking operators are permitted to issue daily parking tickets. This is the same legal model used by:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Public city parking companies</li>
                  <li>Private parking operators</li>
                  <li>Large retail and shopping chains using LPR / ANPR camera systems</li>
                </ul>
                <p>Our practices follow the standard Croatian parking enforcement framework used nationwide.</p>
                <p>For full transparency, guests are always directed to our Legal Terms & Parking Rules, published on our website.</p>
                <p className="italic">If you’d like, I can send you the exact legal page now.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #2: “This feels like a fine.”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>It is not a fine. Fines are issued by public authorities.</p>
                <p>This is a daily parking ticket issued under private parking terms — the same mechanism used by shopping centers and private garages across Croatia.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #3: “I didn’t see the signs.”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>Signage is placed according to regulation and visible at all entry points.</p>
                <p>However, if a guest feels confused or disadvantaged, we prioritize resolution, not punishment.</p>
                <p className="font-bold">If the guest asks for a refund → refund immediately.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #4: “Why is the price so high?”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>The daily ticket price reflects:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>24/7 operations</li>
                  <li>Camera infrastructure</li>
                  <li>Staff, enforcement, support, and logistics</li>
                  <li>Immediate assistance and guaranteed uptime</li>
                </ul>
                <p>We do not operate as a city-subsidized service — all costs are ours.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #5: “I was only there for a short time.”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>The system operates automatically based on entry and exit detection.</p>
                <p>However, we understand mistakes happen.</p>
                <p>Our policy is guest-first — if the guest disputes the situation in good faith, we resolve it quickly and fairly.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #6: “Other parking places don’t do this.”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>Many do — especially private operators, shopping centers, airports, and hotels using LPR systems.</p>
                <p>This is a widely accepted and legally established practice across Croatia and the EU.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection #7: “I want to speak to someone in charge.”</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <p><span className="font-semibold">Response:</span></p>
                <p>Of course. We can escalate immediately.</p>
                <p>Our goal is resolution within minutes, not conflict.</p>
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-4">Golden Rule for All Objections</h2>
              <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                <ul className="list-disc pl-5 space-y-2">
                  <li>De-escalate first</li>
                  <li>Be calm, discreet, and respectful</li>
                  <li>Never argue legality emotionally — state facts and redirect to written terms</li>
                  <li className="font-bold text-black">If a guest insists or feels stranded → refund immediately</li>
                  <li className="font-bold text-black">There is no scenario where a stranded guest is acceptable</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Legal Basis Section */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 uppercase tracking-wide">
              Legal Basis: Mobile LPR Photos, App Security & Court Validity
            </h1>

            <div className="space-y-10">
              <section>
                <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Mobile LPR (License Plate Recognition) Photography</h2>
                <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                  <p>Mobile LPR photos are legal and permitted under Croatian law when used for legitimate interest, such as private parking enforcement.</p>
                  <p>The vehicle license plate is treated as operational data, not sensitive personal data.</p>
                  <p className="mt-2 font-semibold">This is the same legal basis used by:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Public parking companies</li>
                    <li>Private parking operators</li>
                    <li>Shopping centers and retail chains using LPR cameras</li>
                  </ul>
                  <p className="mt-2 font-semibold">Photos are used only to document:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Vehicle presence</li>
                    <li>Entry and exit time</li>
                    <li>Parking duration</li>
                  </ul>
                  <p>They are not used for profiling or unrelated purposes.</p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Evidence Integrity & App Security</h2>
                <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                  <p>All enforcement data is collected through our secure internal app, which includes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Automatic timestamping (date & time locked at capture)</li>
                    <li>GPS location data</li>
                    <li>Cryptographic hash generated at the moment of capture</li>
                    <li>Tamper-proof records (any modification invalidates the hash)</li>
                  </ul>
                  <p className="mt-2 font-semibold">This ensures:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The photo cannot be altered retroactively</li>
                    <li>The time and place of capture are provable</li>
                    <li>The evidence chain is intact</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Legal Validity in Court</h2>
                <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Each record forms a verifiable digital evidence package</li>
                    <li>Time, location, and vehicle data are objectively provable</li>
                    <li>Digital records and contracts generated this way are legally valid and enforceable in court</li>
                  </ul>
                  <p className="mt-2 font-semibold">This follows the same evidentiary standards used in:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Parking disputes</li>
                    <li>Commercial contract enforcement</li>
                    <li>Automated enforcement systems</li>
                  </ul>
                  <p className="mt-4 italic">
                    Our Terms & Conditions, published on our website and accepted by use of the parking facility, form a binding private contract between the operator and the user.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
