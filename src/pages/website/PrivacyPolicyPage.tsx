import { Link } from "react-router-dom";
import { Shield, Lock, Bell, MapPin, Trash2, Mail, Phone, FileText } from "lucide-react";
import WebsitePageLayout from "./WebsitePageLayout";

const SECTIONS = [
  { id: "overview", title: "1. Introduction & Scope" },
  { id: "information-collected", title: "2. Information We Collect" },
  { id: "how-we-use", title: "3. How We Use Information" },
  { id: "third-party", title: "4. Third-Party Services & Permissions" },
  { id: "data-security", title: "5. Data Security & Retention" },
  { id: "your-rights", title: "6. Your Rights & Data Deletion" },
  { id: "children", title: "7. Children's Privacy" },
  { id: "contact", title: "8. Contact & Policy Updates" },
];

export default function PrivacyPolicyPage() {
  return (
    <WebsitePageLayout
      title="Privacy Policy"
      subtitle="How Aboki Bureau De Change collects, uses, and safeguards your information across our official website (abokibdc.com.ng) and mobile application."
      breadcrumb="Privacy Policy"
      badge="Effective Date: May 2026 • Website & Mobile App"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
                <Shield className="w-4 h-4 text-red-600" />
                Contents
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

            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold">Need Privacy Assistance?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                For data access, correction, or account/inquiry deletion requests, contact our Support Desk directly.
              </p>
              <div className="space-y-2 text-xs pt-1">
                <a
                  href="mailto:abokibdcs@gmail.com"
                  className="flex items-center gap-2 text-amber-400 hover:underline font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  abokibdcs@gmail.com
                </a>
                <a
                  href="tel:+2347064937199"
                  className="flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Phone className="w-3.5 h-3.5 text-red-400" />
                  +2347064937199
                </a>
              </div>
            </div>
          </aside>

          {/* Policy Content */}
          <article className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
            <section id="overview" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                1. Introduction & Scope
              </h2>
              <p>
                Aboki Bureau De Change Limited ("Aboki BDC", "we", "our", or "us") respects your privacy and is committed to protecting personal information you share with us. This Privacy Policy explains how we collect, use, store, and safeguard information when you visit{" "}
                <strong>abokibdc.com.ng</strong>, use our mobile web platform at{" "}
                <strong>app.abokibdc.com.ng</strong>, or install our Android/iOS mobile application (
                <strong>com.abokibdc.app</strong>).
              </p>
              <p>
                By accessing our website or mobile application, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section id="information-collected" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                2. Information We Collect
              </h2>
              <p>
                We only collect information necessary to provide real-time exchange rate updates, branch guidance, rate alerts, and travel booking support:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Contact & Travel Booking Details:</strong> When you submit a Travel & Umrah booking form or Contact/Appointment inquiry, we collect the information you provide—such as your full name, phone/WhatsApp number, email address (optional), preferred branch, departure city, destination, travel dates, number of travelers, and special requests.
                </li>
                <li>
                  <strong>Push Notification Tokens & Rate Alerts:</strong> If you enable push notifications or set custom currency rate alerts, we store an anonymous device/browser push token and your chosen target currency alert settings so we can deliver timely rate updates and broadcasts.
                </li>
                <li>
                  <strong>Branch Reviews:</strong> When you voluntarily submit a branch rating or review, we store your display name, star rating, and comment.
                </li>
                <li>
                  <strong>Location Data (Optional & On-Demand):</strong> When you view branch locations on Google Maps or request directions, your device may request location access to show navigation routes. We do <strong>not</strong> continuously track or store your background GPS location.
                </li>
              </ul>
            </section>

            <section id="how-we-use" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                3. How We Use Information
              </h2>
              <p>We use the collected information strictly to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Display accurate, real-time buying and selling foreign exchange rates across our branches.</li>
                <li>Send requested exchange rate alerts and official Aboki BDC announcements via push notifications.</li>
                <li>Respond to your Umrah package, flight ticketing, visa assistance, and foreign exchange inquiries.</li>
                <li>Provide accurate Google Maps directions and contact options for each Aboki BDC branch.</li>
                <li>Maintain platform security, prevent abuse, and improve application reliability.</li>
              </ul>
              <p className="font-semibold text-slate-900">
                We never sell, rent, or trade your personal information to third-party marketers or data brokers.
              </p>
            </section>

            <section id="third-party" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                4. Third-Party Services & Device Permissions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase">
                    <Bell className="w-4 h-4 text-red-600" />
                    Google Firebase & Cloud Messaging
                  </div>
                  <p className="text-xs text-slate-600">
                    Used to synchronize live branch rates, store travel inquiries securely, and deliver opt-in push notifications on Android, iOS, and web devices.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Google Maps Platform
                  </div>
                  <p className="text-xs text-slate-600">
                    Used to render exact branch office pins and open turn-by-turn navigation guidance when requested by the user.
                  </p>
                </div>
              </div>
              <p>
                When you tap a WhatsApp button or phone/email link, you leave our app and communicate directly through WhatsApp, your phone dialer, or your email provider under their respective privacy policies.
              </p>
            </section>

            <section id="data-security" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                5. Data Security & Retention
              </h2>
              <p>
                All network communications between your device and our servers are encrypted in transit via HTTPS/TLS. Customer travel inquiries and contact records are restricted to authorized Aboki Bureau De Change administrators through role-based access controls.
              </p>
              <p>
                We retain booking inquiries only for as long as necessary to fulfill your travel or FX request, provide customer support, and satisfy applicable operational or legal obligations.
              </p>
            </section>

            <section id="your-rights" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                6. Your Privacy Rights & Data Deletion
              </h2>
              <p>
                In accordance with the Nigeria Data Protection Act (NDPA) and global app store standards, you have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Disable push notifications or location permissions at any time via your mobile device or browser settings.</li>
                <li>Request access to or correction of personal information you submitted through our Travel or Contact forms.</li>
                <li>
                  <strong>Request Data Deletion:</strong> Send an email to{" "}
                  <a href="mailto:abokibdcs@gmail.com" className="text-red-600 font-semibold hover:underline">
                    abokibdcs@gmail.com
                  </a>{" "}
                  with the subject line <em>"Data Deletion Request"</em> (including the phone number or booking reference used), and we will permanently delete your submitted records within 7 business days.
                </li>
              </ul>
            </section>

            <section id="children" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                7. Children's Privacy
              </h2>
              <p>
                Our foreign exchange and travel services are intended for adults (18 years and older) and are not directed toward children under the age of 13. We do not knowingly collect personal data from children under 13.
              </p>
            </section>

            <section id="contact" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-28">
              <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black text-slate-950">
                8. Policy Updates & Contact Information
              </h2>
              <p>
                We may update this Privacy Policy periodically to reflect improvements in our services or regulatory guidance. Any updates will be published on this page with an updated effective date.
              </p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900 text-sm">Aboki Bureau De Change Limited</p>
                <p>Head Office: Plot 123, Wuse Zone 4, Behind Sheraton Hotel, Abuja, FCT, Nigeria</p>
                <p>
                  Support Email:{" "}
                  <a href="mailto:abokibdcs@gmail.com" className="text-red-600 font-semibold hover:underline">
                    abokibdcs@gmail.com
                  </a>
                </p>
                <p>
                  Service Line / WhatsApp:{" "}
                  <a href="tel:+2347064937199" className="text-red-600 font-semibold hover:underline">
                    +2347064937199
                  </a>
                </p>
              </div>

              <div className="pt-3 flex flex-wrap gap-3">
                <Link
                  to="/terms-of-service"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <FileText className="w-4 h-4" />
                  Read our Terms of Service →
                </Link>
              </div>
            </section>
          </article>
        </div>
      </div>
    </WebsitePageLayout>
  );
}
