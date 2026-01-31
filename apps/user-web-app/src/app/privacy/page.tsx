'use client';

import { useState } from "react";
import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { ChevronDown } from "lucide-react";

export default function Privacy() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none font-apple-ui">
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
                  <Link href="/experience" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => setBusinessOpen((open) => !open)}
                    >
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
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
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => setCompanyOpen((open) => !open)}
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
                    href="/experience"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Experience
                  </Link>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => setBusinessOpen((open) => !open)}
                  >
                    <span>Business</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {businessOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/business"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
                      <Link
                        href="/parking"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Parking
                      </Link>
                      <Link
                        href="/security"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Security
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
                    onClick={() => setCompanyOpen((open) => !open)}
                  >
                    <span>Company</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {companyOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/about"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        News
                      </Link>
                      <Link
                        href="/contact"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
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
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">Privacy Policy</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-black">
            PayParq Privacy Policy
          </h1>
          <p className="text-xs text-black/50 mb-2">Last updated: {new Date().getFullYear()}</p>
          <p className="text-xs text-black/60 mb-8">
            Tax Number: EIN 98-1844326 · Email:{" "}
            <a href="mailto:payparq@outlook.com" className="underline">
              payparq@outlook.com
            </a>
          </p>

          <div className="space-y-10 text-sm md:text-base text-black/80 leading-relaxed">
            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">
                2. Types of Personal Data We Collect
              </h2>
              <p className="mb-4">
                Depending on your interaction with PayParq, we may collect the following types of personal data:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-black">2.1 Identifying Information</h3>
                  <p>
                    Name, email, phone number, account credentials, vehicle license plate and type, and other
                    registration data.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.2 Vehicle Information</h3>
                  <p>
                    License plate and vehicle information collected via Automatic License Plate Recognition (ALPR) or
                    similar systems, including date, time, and location of parking.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.3 Device &amp; Technical Information</h3>
                  <p>
                    Device identifiers, IP address, cookies, pixels, beacons, mobile advertising IDs, browser type,
                    operating system, and other technical identifiers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.4 Biometric Information</h3>
                  <p>
                    Facial geometry or other biometric data captured through cameras at parking facilities or offices
                    where facial recognition technology is deployed. See Biometric Information Notice below.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.5 Location Data</h3>
                  <p>Precise geolocation of your device if you grant permission.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.6 Financial &amp; Payment Information</h3>
                  <p>
                    Payment details processed via third-party payment providers; we do not store full card data on our
                    servers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.7 Usage &amp; Interaction Data</h3>
                  <p>
                    Browsing activity, interactions with our websites or apps, search history, survey responses,
                    reviews, and other user-generated content.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.8 Audio/Visual Information</h3>
                  <p>
                    Video, audio, and photographic records of your vehicle, parking session, or interactions at
                    facilities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.9 Professional / Employment Data</h3>
                  <p>Resume, application materials, and personal data collected at job fairs or conferences.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black">2.10 Inferences</h3>
                  <p>Insights derived from your activity, preferences, and other collected data.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">3. How We Collect Personal Data</h2>
              <p className="mb-3">We collect data in three ways:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Directly from you:</span> Account creation, surveys, purchases,
                  emails, customer support, or app interactions.
                </li>
                <li>
                  <span className="font-semibold">Automatically:</span> Cookies, tracking pixels, mobile identifiers,
                  website logs, and ALPR systems.
                </li>
                <li>
                  <span className="font-semibold">From third parties:</span> Business partners, hotels, data analytics
                  providers, advertising networks, and payment processors.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">
                4. Legal Bases for Processing (GDPR)
              </h2>
              <p className="mb-3">We process personal data under the following legal bases:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Consent:</span> When you voluntarily provide personal information or
                  opt in.
                </li>
                <li>
                  <span className="font-semibold">Contractual necessity:</span> To provide our Services or fulfill
                  agreements with you.
                </li>
                <li>
                  <span className="font-semibold">Legal obligation:</span> To comply with applicable laws.
                </li>
                <li>
                  <span className="font-semibold">Legitimate interests:</span> To operate our Services, prevent fraud,
                  secure facilities, or improve user experience.
                </li>
                <li>
                  <span className="font-semibold">Vital interests:</span> To protect individuals in emergencies.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">5. How We Use Your Data</h2>
              <p className="mb-3">PayParq uses personal data to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Operate, maintain, and improve Services.</li>
                <li>Facilitate account and payment management.</li>
                <li>Communicate with users about their accounts, support, or marketing (where permitted).</li>
                <li>Conduct analytics and personalize experiences.</li>
                <li>Train AI and machine learning systems.</li>
                <li>Prevent fraud, enforce rules, and maintain security.</li>
                <li>Comply with legal obligations and resolve disputes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">6. How We Share Personal Data</h2>
              <p className="mb-3">We may share data with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Service Providers:</span> Vendors, cloud hosts, and contractors
                  providing operational support.
                </li>
                <li>
                  <span className="font-semibold">Business Customers:</span> Hotels or facilities where PayParq
                  operates. Each customer may have separate privacy policies.
                </li>
                <li>
                  <span className="font-semibold">Affiliates &amp; Corporate Partners:</span> Parent and subsidiary
                  companies.
                </li>
                <li>
                  <span className="font-semibold">Advertising Partners:</span> For GDPR-compliant, opt-in marketing
                  only.
                </li>
                <li>
                  <span className="font-semibold">Legal Authorities:</span> As required by law or to enforce our
                  rights.
                </li>
                <li>
                  <span className="font-semibold">Corporate Transactions:</span> In case of merger, acquisition, or
                  insolvency.
                </li>
              </ul>
              <p className="mt-3">We never sell data outside of legal obligations.</p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">7. Cross-Border Data Transfers</h2>
              <p>
                Your data may be transferred outside the EU, for example to servers in the USA. Transfers are
                safeguarded via Standard Contractual Clauses (SCCs) or other legally recognized safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">8. Retention of Personal Data</h2>
              <p className="mb-3">
                PayParq retains personal data only as long as necessary to fulfill the purposes for which it was
                collected, comply with legal obligations, resolve disputes, or enforce agreements, except where
                otherwise specified below.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Account and member data:</span> Account information, including login
                  credentials, vehicle registration, payment history, user preferences, and related membership data, may
                  be retained indefinitely for the purposes of account management, historical reference, dispute
                  resolution, auditing, and internal recordkeeping.
                </li>
                <li>
                  <span className="font-semibold">ALPR data:</span> 90 days for paid customers, 5 years for unpaid
                  citations.
                </li>
                <li>
                  <span className="font-semibold">Biometric data:</span> Until initial purpose is fulfilled or 3 years
                  after last interaction.
                </li>
                <li>
                  <span className="font-semibold">Other personal data:</span> As required to comply with law or
                  internal policies.
                </li>
              </ul>
              <p className="mt-3">
                Financial and payment data is stored in accordance with legal, tax, and accounting requirements. Data
                processed via third-party providers is subject to their retention policies. PayParq regularly reviews
                personal data to ensure it is accurate and up to date. Data that is no longer needed for its intended
                purpose is securely deleted or anonymized, except for account and member data which may be retained
                indefinitely as described above.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">9. Your Rights (GDPR)</h2>
              <p className="mb-3">You have the following rights under EU law:</p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <span className="font-semibold">Access &amp; Portability:</span> Request a copy of your personal
                  data.
                </li>
                <li>
                  <span className="font-semibold">Correction:</span> Correct inaccurate data.
                </li>
                <li>
                  <span className="font-semibold">Deletion / Right to be forgotten:</span> Request data deletion.
                </li>
                <li>
                  <span className="font-semibold">Restriction of processing:</span> Limit how your data is used.
                </li>
                <li>
                  <span className="font-semibold">Objection:</span> Object to marketing or profiling.
                </li>
                <li>
                  <span className="font-semibold">Withdraw consent:</span> Where processing is consent-based.
                </li>
                <li>
                  <span className="font-semibold">Data portability:</span> Receive data in structured,
                  machine-readable format.
                </li>
              </ul>
              <p>
                Requests can be sent to{" "}
                <a href="mailto:payparq@outlook.com" className="underline">
                  payparq@outlook.com
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">10. Cookies and Tracking</h2>
              <p className="mb-3">PayParq uses cookies, pixels, and tracking tools to:</p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>Ensure website functionality.</li>
                <li>Personalize content.</li>
                <li>Deliver analytics and advertising.</li>
              </ul>
              <p>
                Users can manage preferences in the cookie banner or device settings. Essential cookies cannot be
                disabled.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">
                11. Biometric Information Privacy Notice
              </h2>
              <p className="mb-3">We may collect facial geometry data for:</p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>Contactless parking.</li>
                <li>Security verification.</li>
                <li>Customer experience enhancement.</li>
              </ul>
              <p className="mb-2">
                <span className="font-semibold">Retention:</span> Until initial purpose is fulfilled or 3 years post
                last interaction.
              </p>
              <p>
                <span className="font-semibold">Rights:</span> Request access, deletion, or opt-out via{" "}
                <a href="mailto:payparq@outlook.com" className="underline">
                  payparq@outlook.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">12. Children</h2>
              <p>
                Our Services are not intended for persons under 16 years. We do not knowingly collect data from children
                under this age.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">13. Data Security</h2>
              <p className="mb-3">We implement state-of-the-art security measures, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Encryption at rest and in transit.</li>
                <li>Role-based access controls.</li>
                <li>Audit logs for ALPR and sensitive data.</li>
                <li>Regular security testing and penetration tests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">14. Changes to This Privacy Policy</h2>
              <p>
                We may update this Policy. All updates will be posted here, with an updated effective date at the top of
                this page.
              </p>
            </section>

            <section>
              <h2 className="text-base md:text-lg font-semibold text-black mb-3">15. Contact Us</h2>
              <p className="mb-3">For privacy inquiries or concerns:</p>
              <p>PayParq Global Inc.</p>
              <p>1309 Coffeen Avenue STE 1200</p>
              <p>Sheridan, Wyoming 82801, USA</p>
              <p>Parent Company: Leadvex Group</p>
            </section>
          </div>
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
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100 transition-colors">
                  <span className="text-xs">Download on the App Store</span>
                </button>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Experience</p>
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
                  <button className="block hover:text-white transition-colors">Terms</button>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
                  <button className="block hover:text-white transition-colors">Partners</button>
                  <button className="block hover:text-white transition-colors">Support</button>
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
