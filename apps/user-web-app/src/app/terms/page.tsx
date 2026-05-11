'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function Terms() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <header className="hidden">
        <div className="w-full px-4 md:px-10 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-8 text-[11px] font-medium text-black">
              <div className="flex items-center justify-start md:justify-center gap-4">
                <button
                  type="button"
                  className="md:hidden flex flex-col justify-center gap-[3px]"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  <span className="h-[1.5px] w-4 bg-black" />
                  <span className="h-[1.5px] w-4 bg-black" />
                </button>
                <div className="hidden md:flex items-center justify-center gap-7 text-[10px] uppercase tracking-[0.24em]">
                  <Link href="/vision" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setBusinessOpen((open) => !open);
                        setCompanyOpen(false);
                      }}
                    >
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setCompanyOpen((open) => !open);
                        setBusinessOpen(false);
                      }}
                    >
                      <span>Company</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[200px] z-50">
                        <Link
                          href="/about"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          News
                        </Link>
                        <Link
                          href="/contact"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Get in touch
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Link href="/" className="relative flex items-center justify-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                      <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">
                        P
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-3">
                <Link
                  href="/contact"
                  className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get in Touch
                </Link>
                <Link
                  href="/pay"
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Pay Now
                </Link>
              </div>
            </div>
            {mobileOpen && (
              <div className="md:hidden border-t border-black/5 bg-white px-0 pb-3">
                <div className="flex flex-col gap-2 pt-2 text-[12px] font-medium text-black w-full max-w-xs mx-auto">
                  <Link
                    href="/vision"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Experience
                  </Link>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setBusinessOpen((open) => !open);
                      setCompanyOpen(false);
                    }}
                  >
                    <span>Business</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {businessOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/parking"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Parking
                      </Link>
                      <Link
                        href="/security"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Security
                      </Link>
                      <Link
                        href="/business"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/technology"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Technology
                  </Link>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setCompanyOpen((open) => !open);
                      setBusinessOpen(false);
                    }}
                  >
                    <span>Company</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {companyOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/about"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        News
                      </Link>
                      <Link
                        href="/contact"
                        className="w-full py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Get in touch
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/contact"
                    className="w-full mt-2 border-t border-b border-gray-200 py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get in Touch
                  </Link>
                  <Link
                    href="/pay"
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Pay Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-14 md:py-20 text-black">
          <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">
            PayParq Global Inc. – Terms of Service
          </h1>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">Table of Contents</h2>
            <ol className="list-decimal pl-5 text-sm text-black/70 space-y-1">
              <li>Definitions</li>
              <li>Acceptance of Terms</li>
              <li>Eligibility &amp; Account Registration</li>
              <li>Description of Services</li>
              <li>Use of the Platform</li>
              <li>Fees, Payments &amp; Billing</li>
              <li>Parking Rules, Conduct, and Enforcement</li>
              <li>No Liability — Risk Allocation</li>
              <li>Insurance and Optional Coverages</li>
              <li>Data Collection, Privacy, and Retention</li>
              <li>Intellectual Property</li>
              <li>Termination and Suspension</li>
              <li>Dispute Resolution; Arbitration Agreement</li>
              <li>Indemnification</li>
              <li>Modification of Terms</li>
              <li>Electronic Communications and Consent</li>
              <li>Severability; Waiver</li>
              <li>Assignment</li>
              <li>Entire Agreement</li>
              <li>Addendum A — Edge Cases and Absolute Disclaimers</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">1. Definitions</h2>
            <p className="text-sm text-black/70 mb-2">
              (a) “App”: the PayParq mobile application(s) and web interfaces.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (b) “Service”: parking booking, payment, enforcement, and analytics services offered via PayParq.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (c) “User”: any individual or legal entity using the Service, including Drivers, Operators, Municipal
              Partners, and Guests.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (d) “Driver”: a User parking a motor vehicle using the Service.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (e) “Operator”: a licensed entity or individual offering parking spaces through PayParq.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (f) “Municipal Partner”: a city or governmental body integrating PayParq for parking management.
            </p>
            <p className="text-sm text-black/70 mb-2">
              (g) “Third‑Party Provider”: payment processors, communication platforms, mapping services, and
              enforcement partners.
            </p>
            <p className="text-sm text-black/70">
              (h) “Content”: all data, text, graphics, or information created or submitted by Users or PayParq.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">2. Acceptance of Terms</h2>
            <p className="text-sm text-black/70 mb-2">
              By accessing or using PayParq in any form (app, website, or third-party integration), you agree to be
              bound by these Terms. If you do not accept them fully, you must immediately stop using the Service.
            </p>
            <p className="text-sm text-black/70">
              These Terms constitute a legally binding contract between you and PayParq Global Inc.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">3. Eligibility &amp; Account Registration</h2>
            <p className="text-sm font-semibold text-black/80 mb-2">3.1 Eligibility</p>
            <p className="text-sm text-black/70 mb-2">
              The Service is for Users 18 years or older. By using the Service, you confirm:
            </p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>You have the legal capacity to enter a binding agreement;</li>
              <li>You will comply with all applicable EU, Croatian, and local laws;</li>
              <li>You will follow parking regulations and traffic rules in any jurisdiction you operate.</li>
            </ul>
            <p className="text-sm font-semibold text-black/80 mb-2">3.2 Account Registration</p>
            <p className="text-sm text-black/70 mb-2">
              To access core features, Users must create an account:
            </p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Provide accurate, complete, and current information;</li>
              <li>Maintain security of login credentials;</li>
              <li>Immediately notify PayParq of unauthorized use.</li>
            </ul>
            <p className="text-sm text-black/70">
              Note: PayParq is not responsible for account compromise or unauthorized use by third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">4. Description of Services</h2>
            <p className="text-sm text-black/70 mb-2">PayParq offers:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Parking Authorization &amp; Payment: Users can find, book, and pay for parking spaces.</li>
              <li>Enforcement Tools: Operators and Municipal Partners may monitor compliance.</li>
              <li>Data Analytics: Reporting dashboards for usage, revenue, and occupancy.</li>
              <li>Communication Tools: SMS, email, push notifications.</li>
              <li>Optional Insurance Products: Available via third-party providers.</li>
            </ul>
            <p className="text-sm text-black/70">
              Disclaimer: PayParq is a software platform only. Operational responsibilities, vehicle safety, and
              compliance are fully borne by Users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">5. Use of the Platform</h2>
            <p className="text-sm font-semibold text-black/80 mb-2">5.1 License Grant</p>
            <p className="text-sm text-black/70 mb-2">
              PayParq grants a limited, non-exclusive, non-transferable license to access and use the Service in
              compliance with these Terms.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">5.2 Acceptable Use</p>
            <p className="text-sm text-black/70 mb-2">Users may not:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 space-y-1">
              <li>Violate EU, Croatian, or local laws;</li>
              <li>Upload malware, viruses, or harmful code;</li>
              <li>Reverse engineer the App or API;</li>
              <li>Attempt to access restricted areas;</li>
              <li>Misuse the platform or third-party integrations.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">6. Fees, Payments &amp; Billing</h2>
            <p className="text-sm font-semibold text-black/80 mb-2">6.1 Payment Obligations</p>
            <p className="text-sm text-black/70 mb-2">
              Users agree to pay applicable fees for parking, services, or optional insurance. Fees may vary by
              location or market conditions.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">6.2 Third-Party Payment Processing</p>
            <p className="text-sm text-black/70 mb-2">
              Payments are processed via integrated providers. PayParq is not responsible for processing errors or
              disputes beyond facilitating the transaction.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">6.3 Billing Disputes</p>
            <p className="text-sm text-black/70 mb-2">
              Disputes must be submitted within 30 days. PayParq may assist but does not guarantee refunds.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">6.4 Taxes</p>
            <p className="text-sm text-black/70">
              Users are responsible for applicable EU VAT, local taxes, or duties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">7. Parking Rules, Conduct, and Enforcement</h2>
            <p className="text-sm text-black/70 mb-2">
              Users assume full responsibility for observing local parking laws.
            </p>
            <p className="text-sm text-black/70 mb-2">
              Operators and Municipal Partners manage enforcement; PayParq is not liable for fines or legal actions.
            </p>
            <p className="text-sm text-black/70">
              PayParq does not guarantee space availability, pricing, or accuracy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">8. No Liability — Risk Allocation</h2>
            <p className="text-sm font-semibold text-black/80 mb-2">8.1 Express Disclaimer</p>
            <p className="text-sm text-black/70 mb-2">To the maximum extent allowed by EU and Croatian law, PayParq and affiliates are not liable for:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Vehicle damage, theft, or vandalism;</li>
              <li>Personal injury or death;</li>
              <li>Fines, enforcement, or legal claims;</li>
              <li>Payment disputes;</li>
              <li>Data breaches, account compromise, or service outages;</li>
              <li>Third-party integrations (Stripe, WhatsApp, Uber, etc.).</li>
            </ul>
            <p className="text-sm font-semibold text-black/80 mb-2">8.2 No Warranties</p>
            <p className="text-sm text-black/70 mb-2">
              Service is provided “as is” and “as available”, without any warranty of fitness, merchantability, or
              non-infringement.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">8.3 Risk Allocation</p>
            <p className="text-sm text-black/70">
              Use is at your sole risk. PayParq is not an insurer and does not assume responsibility for parking safety
              or compliance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">9. Insurance and Optional Coverages</h2>
            <p className="text-sm text-black/70">
              Any optional insurance is provided by third-party carriers. PayParq is not responsible for denied claims,
              limits, or carrier conduct.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">10. Data Collection, Privacy, and Retention</h2>
            <p className="text-sm font-semibold text-black/80 mb-2">10.1 Consent</p>
            <p className="text-sm text-black/70 mb-2">
              Users consent to collection and processing of personal data in accordance with EU GDPR and PayParq
              Privacy Policy.
            </p>
            <p className="text-sm font-semibold text-black/80 mb-2">10.2 Retention</p>
            <p className="text-sm text-black/70 mb-2">Data may be stored indefinitely for:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Operational purposes</li>
              <li>Analytics</li>
              <li>Legal compliance</li>
              <li>Security</li>
            </ul>
            <p className="text-sm font-semibold text-black/80 mb-2">10.3 Security</p>
            <p className="text-sm text-black/70">
              PayParq applies industry-standard security measures but cannot guarantee absolute protection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">11. Intellectual Property</h2>
            <p className="text-sm text-black/70">
              All software, graphics, logos, and content remain the property of PayParq or its licensors. Users may not
              copy, distribute, or modify content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">12. Termination and Suspension</h2>
            <p className="text-sm text-black/70 mb-2">PayParq may suspend or terminate accounts for:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Breach of Terms</li>
              <li>Fraud or unauthorized use</li>
              <li>Legal obligations</li>
            </ul>
            <p className="text-sm text-black/70">
              Termination does not release Users from liability or indemnification obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">13. Dispute Resolution; Arbitration</h2>
            <p className="text-sm text-black/70 mb-2">
              Disputes are governed by Croatian law, EU regulations, and may be resolved via:
            </p>
            <ul className="list-disc pl-5 text-sm text-black/70 space-y-1">
              <li>Arbitration under Croatian Chamber of Commerce rules</li>
              <li>Waiver of class actions or jury trial claims</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">14. Indemnification</h2>
            <p className="text-sm text-black/70 mb-2">
              Users agree to indemnify and hold PayParq harmless for claims arising from:
            </p>
            <ul className="list-disc pl-5 text-sm text-black/70 space-y-1">
              <li>Violation of Terms</li>
              <li>Parking violations or traffic offenses</li>
              <li>Misuse of the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">15. Modification of Terms</h2>
            <p className="text-sm text-black/70">
              PayParq may update Terms at any time. Continued use after updates constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">16. Electronic Communications</h2>
            <p className="text-sm text-black/70 mb-2">Users consent to:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Emails, push notifications, in-app messages for notices</li>
              <li>Electronic agreements being legally binding</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">17. Severability; Waiver</h2>
            <p className="text-sm text-black/70 mb-2">
              Invalid provisions do not invalidate the remainder of these Terms.
            </p>
            <p className="text-sm text-black/70">
              Waiver of a breach does not waive future breaches.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">18. Assignment</h2>
            <p className="text-sm text-black/70">
              Users may not assign rights. PayParq may assign rights to affiliates or successors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-3">19. Entire Agreement</h2>
            <p className="text-sm text-black/70">
              These Terms and referenced policies are the full agreement between Users and PayParq.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-black mb-3">20. Addendum A — Edge Cases and Absolute Disclaimers</h2>
            <p className="text-sm text-black/70 mb-2">The following scenarios are expressly disclaimed:</p>
            <ul className="list-disc pl-5 text-sm text-black/70 mb-2 space-y-1">
              <li>Natural disasters (floods, earthquakes, storms)</li>
              <li>Acts of terrorism, war, civil unrest</li>
              <li>Vehicle malfunctions, mechanical failures</li>
              <li>Cybersecurity breaches, hacking, device loss</li>
              <li>Fines, penalties, or government enforcement</li>
              <li>Third-party service failures (Stripe, Uber, WhatsApp)</li>
              <li>Unauthorized device modifications</li>
              <li>Any indirect, incidental, or punitive damages</li>
              <li>Parking outside authorized zones</li>
              <li>Data loss from user or device error</li>
            </ul>
            <p className="text-sm text-black/70 mb-4">
              All Users acknowledge these risks and accept full responsibility.
            </p>
            <p className="text-sm text-black/80 mb-1">Contact Information:</p>
            <p className="text-sm text-black/70">
              Email: payparq@outlook.com
      <br />
      Company: Leadvex Group LLC
      <br />
      Headquarters: 1309 Coffeen Avenue, Suite 1200, Sheridan, WY 82801, USA
      <br />
      EU Operations: Croatia - Leadvex Group LLC
    </p>
          </section>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                  For drivers, operators, and cities
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">
                  Frictionless access to anywhere you want to be
                </h2>
                <p className="text-sm text-white/70 mb-6 max-w-md">
                  From mixed-use garages to open-air lots, payparq turns any space into a seamless, app-free arrival
                  experience while unlocking new revenue.
                </p>
                <a
                  href="https://www.admin.payparq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs">Manage Smarter, Earn More</span>
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Company</p>
                  <Link href="/about" className="block hover:text-white transition-colors">
                    About
                  </Link>
                  <Link href="/careers" className="block hover:text-white transition-colors">
                    Careers
                  </Link>
                  <Link href="/news" className="block hover:text-white transition-colors">
                    News
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Vision</p>
                  <Link href="/product" className="block hover:text-white transition-colors">
                    Product
                  </Link>
                  <Link href="/parking" className="block hover:text-white transition-colors">
                    Parking
                  </Link>
                  <Link href="/security" className="block hover:text-white transition-colors">
                    Security
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
                  <Link href="/legal" className="block hover:text-white transition-colors">
                    Legal
                  </Link>
                  <Link href="/privacy" className="block hover:text-white transition-colors">
                    Privacy
                  </Link>
                  <Link href="/terms" className="block hover:text-white transition-colors">
                    Terms
                  </Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
                  <Link href="/locations" className="block hover:text-white transition-colors">
                    Locations
                  </Link>
                  <Link href="/members" className="block hover:text-white transition-colors">
                    Members
                  </Link>
                  <Link href="/support" className="block hover:text-white transition-colors">
                    Support
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-6 border-t border-white/10">
              <FooterBrand />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
