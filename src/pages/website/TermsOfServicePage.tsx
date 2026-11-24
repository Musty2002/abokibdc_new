import { Link } from "react-router-dom";
import { FileText, Scale, AlertTriangle, Plane, ShieldCheck, Mail, Phone } from "lucide-react";
import WebsitePageLayout from "./WebsitePageLayout";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "exchange-rates", title: "2. Exchange Rates & Currency Policy" },
  { id: "informational-platform", title: "3. Platform Scope & Branch Transactions" },
  { id: "travels-umrah", title: "4. Aboki BDC Travels, Umrah & Flights" },
  { id: "alerts-notifications", title: "5. Rate Alerts & Push Notifications" },
  { id: "acceptable-use", title: "6. Acceptable Use & Intellectual Property" },
  { id: "liability", title: "7. Disclaimers & Limitation of Liability" },
  { id: "governing-law", title: "8. Governing Law & Contact" },
];

export default function TermsOfServicePage() {
  return (
    <WebsitePageLayout
      title="Terms of Service"
      subtitle="Please read these Terms of Service carefully before using the Aboki Bureau De Change website, mobile app, currency calculator, or travel booking services."
      breadcrumb="Terms of Service"
      badge="Effective Date: May 2026 • Aboki Bureau De Change"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
                <Scale className="w-4 h-4 text-red-600" />
                Agreement Sections
              </div>
              <nav className="space-y-1.5">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs font-semibold text-slate-600 hover:text-red-600 py-1 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Important Market Notice
              </div>
              <p className="text-xs text-amber-900/85 leading-relaxed">
                Foreign exchange rates fluctuate continuously throughout the day. Always confirm final buying or selling rates with your chosen Aboki BDC branch desk prior to executing a transaction.
              </p>
            </div>
          </aside>

          {/* Terms Content */}
          <article className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
            <section id="acceptance" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use of the{" "}
                <strong>Aboki Bureau De Change</strong> website (<strong>abokibdc.com.ng</strong>), mobile web app (<strong>app.abokibdc.com.ng</strong>), Android/iOS mobile application, and related foreign exchange and travel inquiry services operated by Aboki Bureau De Change Limited ("Aboki BDC", "we", "our").
              </p>
              <p>
                By accessing or using our platform, you confirm that you are at least 18 years old and agree to be bound by these Terms and our{" "}
                <Link to="/privacy-policy" className="text-red-600 font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section id="exchange-rates" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                2. Exchange Rates & Currency Policy
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Indicative Real-Time Rates:</strong> Buying and selling rates published on our website, currency converter, and mobile application reflect current branch updates and market movements. Because FX markets change rapidly, rates are subject to change without prior notice.
                </li>
                <li>
                  <strong>Denomination & Note Condition:</strong> Different currency denominations (for example, USD $100 bills versus smaller denominations) may carry different exchange rates. All physical banknotes must be clean, authentic, and undamaged.
                </li>
                <li>
                  <strong>Banknotes Only (No Coins):</strong> Aboki Bureau De Change exchanges valid foreign banknotes only and does <strong>not</strong> accept or exchange foreign coins of any currency.
                </li>
              </ul>
            </section>

            <section id="informational-platform" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                3. Platform Scope & Branch Transactions
              </h2>
              <p>
                Our website and mobile app serve as an informational, rate-comparison, branch-locator, and booking-inquiry platform. The platform itself does not directly process online card payments or automated cross-border wire transfers.
              </p>
              <p>
                All physical foreign currency exchanges are finalized directly at our designated branch offices or through official branch desk confirmation in compliance with applicable identity verification (KYC) and anti-money-laundering requirements.
              </p>
            </section>

            <section id="travels-umrah" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950 flex items-center gap-2">
                <Plane className="w-5 h-5 text-red-600" />
                4. Aboki BDC Travels, Umrah & Flight Bookings
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Quotes & Availability:</strong> Prices displayed for Executive Umrah, Economy Plus Umrah, domestic/international flight deals, and holiday tours are starting estimates and are confirmed upon ticket issuance and hotel allocation.
                </li>
                <li>
                  <strong>Passport & Visa Responsibility:</strong> Travelers are responsible for providing accurate passport details (with at least 6 months validity) and required supporting documentation. Visa issuance is solely at the discretion of the relevant embassy or immigration authority (including Saudi Ministry of Hajj & Umrah regulations).
                </li>
                <li>
                  <strong>Changes & Cancellations:</strong> Flight rescheduling, cancellations, and refunds are governed by the respective airline, hotel, and tour operator fare rules.
                </li>
              </ul>
            </section>

            <section id="alerts-notifications" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                5. Rate Alerts & Push Notifications
              </h2>
              <p>
                Rate alerts and push notifications are provided on a best-effort basis and depend on device connectivity, notification permissions, and third-party push delivery services. Aboki BDC is not liable for delayed, missed, or undelivered notifications or any financial decision made solely in reliance on an alert.
              </p>
            </section>

            <section id="acceptable-use" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                6. Acceptable Use & Intellectual Property
              </h2>
              <p>When using our website or app, you agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Submit false, fraudulent, or misleading booking inquiries or branch reviews.</li>
                <li>Attempt unauthorized access to administrative portals, APIs, or underlying databases.</li>
                <li>Scrape, copy, or redistribute Aboki BDC branding, logos, or live rate feeds for unauthorized commercial resale.</li>
              </ul>
              <p>
                All brand names, logos, layouts, and content appearing on this platform are the property of Aboki Bureau De Change Limited or its respective licensors.
              </p>
            </section>

            <section id="liability" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                7. Disclaimers & Limitation of Liability
              </h2>
              <p>
                The platform and all rate information are provided on an <em>"as is"</em> and <em>"as available"</em> basis without warranties of any kind, whether express or implied. To the fullest extent permitted by law, Aboki Bureau De Change Limited shall not be liable for any indirect, incidental, special, or consequential losses arising from exchange rate fluctuations, temporary service interruptions, or third-party service outages.
              </p>
            </section>

            <section id="governing-law" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                8. Governing Law & Contact Us
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the <strong>Federal Republic of Nigeria</strong>. We reserve the right to update these Terms at any time by posting the revised version on this page.
              </p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900 text-sm">Questions About These Terms?</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <a href="mailto:abokibdcs@gmail.com" className="text-red-600 font-semibold hover:underline">
                    abokibdcs@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-red-600" />
                  <a href="tel:+2347064937199" className="text-red-600 font-semibold hover:underline">
                    +2347064937199
                  </a>
                </p>
              </div>

              <div className="pt-3 flex flex-wrap gap-4">
                <Link
                  to="/privacy-policy"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <FileText className="w-4 h-4" />
                  View Privacy Policy →
                </Link>
                <Link
                  to="/contact-us"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-red-600"
                >
                  Go to Contact Us →
                </Link>
              </div>
            </section>
          </article>
        </div>
      </div>
    </WebsitePageLayout>
  );
}
