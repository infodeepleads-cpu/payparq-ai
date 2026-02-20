import React from 'react';

export default function SalesRulesPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 uppercase tracking-wide">
          Sales & Contact Rules
        </h1>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Channels</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Phone, Email, SMS, WhatsApp — only if the user initiates contact via that channel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Demo & Trial</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              All demos, no-risk trials, and activations are live, in person, with the decision maker, on the first contact. 
              If he is not there then call and try to set appointment never pitch on the phone but always say urgently what it is about.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Closing on the Phone</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Never close on the phone on the first contact. Phone is for setting appointment today/tommorow/term. 
              Follow-Ups closes, and Upsells can be done by the phone but first contact never.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Next Step Discipline</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Every interaction must end with a scheduled call or meeting at an exact time.
              <br />
              If more information is requested: send it immediately, then call the same day to close.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Appointments</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Appointments are set by phone only — today (danas) or tomorrow (sutra) if not possible schedule a term. 
              No open-ended scheduling.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Speed Rule</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Call within 60 seconds of any response.
              <br />
              If seen in person, close immediately if not schedule appointment call and follow up with more info immediately then try to close on the phone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Lead Entry & Pre-Warm</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Initial prewarm contact should be via email if possible if not by the phone, then cold walk in PITCH phone appointment if not there.
              <br />
              Walk Cold in Script through Digitisation + Grants, Empty Lot activation for empty land owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Objection Handling</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              If objections arise, log them into machine.io.
              <br />
              If still “no,” ask: What would this need to have for you to say yes?
              <br />
              Record the answer in machine.io.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Data Discipline</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Every interaction with a lead must be logged and described in Supabase / machine.io.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Conversation Minimum</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Aim for at least 1 minute of live conversation per contact — this lowers resistance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Operator Support</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Use Chat for materials: emails, contracts, invoices, drafts, tactics, appearance guidance, reminders, complex WHALE sales, multi-demo flows, company research, and lobbying strategies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Daily Improvement</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Learn the product every day. Improve it continuously.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Urgency & Framing</h2>
            <div className="text-gray-700 leading-relaxed text-sm">
              Every prospect interaction is urgent and value-driven:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You have unused capacity.</li>
                <li>I will stop unauthorized vehicles.</li>
                <li>I will increase reviews, revenue, safety, and digitization.</li>
                <li>I will eliminate congestion.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-2">Decision Maker Rule</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              No decision maker = no close. Always reach the decision maker.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
