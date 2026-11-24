import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Moon,
} from "lucide-react";
import abokiLogo from "@/assets/aboki-logo.jpg";

interface WebsitePageLayoutProps {
  title: string;
  subtitle: string;
  breadcrumb: string;
  badge?: string;
  children: React.ReactNode;
}

export default function WebsitePageLayout({
  title,
  subtitle,
  breadcrumb,
  badge,
  children,
}: WebsitePageLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [breadcrumb]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-950 text-slate-200 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="tel:+2347064937199"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-red-500" />
              <span>Service Line: +2347064937199</span>
            </a>
            <a
              href="mailto:abokibdcs@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium"
            >
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>Support Email: abokibdcs@gmail.com</span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Head Office: Wuse Zone 4, Behind Sheraton Hotel, Abuja</span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={abokiLogo}
              alt="Aboki Bureau De Change"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-red-600/30 shadow-sm shrink-0"
            />
            <div>
              <span className="block font-['Playfair_Display',Georgia,serif] font-black text-lg sm:text-xl text-slate-950 tracking-tight leading-none">
                ABOKI BUREAU DE CHANGE
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-red-600 mt-1">
                Trusted FX & Global Travels
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-700">
            <Link to="/" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Home
            </Link>
            <Link to="/market-rates" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Rates
            </Link>
            <Link to="/branch" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Branches
            </Link>
            <Link
              to="/about"
              className="hover:text-red-600 transition-colors uppercase tracking-wide flex items-center gap-1 text-red-600"
            >
              <Moon className="w-3.5 h-3.5" />
              Travels & Umrah
            </Link>
            <Link to="/contact-us" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Contact Us
            </Link>
            <Link to="/privacy-policy" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-red-600 transition-colors uppercase tracking-wide">
              Terms
            </Link>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/contact-us"
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
            >
              <span>Make An Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-2 shadow-lg">
            {[
              { label: "HOME", to: "/" },
              { label: "LIVE RATES", to: "/market-rates" },
              { label: "BRANCHES", to: "/branch" },
              { label: "CONTACT US", to: "/contact-us" },
              { label: "PRIVACY POLICY", to: "/privacy-policy" },
              { label: "TERMS OF SERVICE", to: "/terms-of-service" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-slate-800 hover:bg-red-50 hover:text-red-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Page Hero Banner */}
      <section className="bg-slate-950 text-white border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-red-400 font-semibold">{breadcrumb}</span>
          </div>

          {badge && (
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
              {badge}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-['Playfair_Display',Georgia,serif] font-black text-white leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={abokiLogo}
                  alt="Aboki BDC"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/40"
                />
                <h3 className="font-['Playfair_Display',Georgia,serif] font-black text-lg text-white">
                  ABOKI BUREAU DE CHANGE
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aboki Bureau De Change Limited is a premier financial services institution providing real-time foreign currency exchange and global travel services across Nigeria.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
                Contacts
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Plot 123, Wuse Zone 4, Behind Sheraton Hotel, Abuja, FCT</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <a href="tel:+2347064937199" className="hover:text-white">
                    +2347064937199
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500 shrink-0" />
                  <a href="mailto:abokibdcs@gmail.com" className="hover:text-white">
                    abokibdcs@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
                Quick Links & Legal
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Link to="/" className="text-slate-400 hover:text-white">
                  Home
                </Link>
                <Link to="/market-rates" className="text-slate-400 hover:text-white">
                  Market Rates
                </Link>
                <Link to="/branch" className="text-slate-400 hover:text-white">
                  Branches
                </Link>
                <Link to="/contact-us" className="text-slate-400 hover:text-white">
                  Contact Us
                </Link>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white">
                  Privacy Policy
                </Link>
                <Link to="/terms-of-service" className="text-slate-400 hover:text-white">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Copyright © {new Date().getFullYear()} Aboki Bureau De Change | All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="hover:text-slate-300">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-slate-300">
                Terms of Service
              </Link>
              <Link to="/contact-us" className="hover:text-slate-300">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
