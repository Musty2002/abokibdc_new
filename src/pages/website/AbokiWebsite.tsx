import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Plane,
  Moon,
  Globe,
  CheckCircle2,
  Calculator,
  Menu,
  X,
  Star,
  Calendar,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import abokiLogo from "@/assets/aboki-logo.jpg";
import { Branch, CityData, branchesData, getBranchCoordinates } from "@/data/branchesData";
import { supabase } from "@/integrations/supabase/client";
import BranchDetailSheet from "@/components/rates/BranchDetailSheet";
import { toast } from "@/hooks/use-toast";

const getFlagCode = (currencyCode: string): string => {
  const flagMap: Record<string, string> = {
    USD: "us",
    EUR: "eu",
    GBP: "gb",
    CAD: "ca",
    AED: "ae",
    ZAR: "za",
    CNY: "cn",
    CHF: "ch",
    AUD: "au",
    JPY: "jp",
    SAR: "sa",
    KWD: "kw",
    QAR: "qa",
    OMR: "om",
    BHD: "bh",
    EGP: "eg",
  };
  return flagMap[currencyCode] || "us";
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  GBP: "British Pound Sterling",
  EUR: "Euro",
  CAD: "Canadian Dollar",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  CNY: "Chinese Yuan",
  CHF: "Swiss Franc",
  ZAR: "South African Rand",
};

const FAQ_ITEMS = [
  {
    q: "WHO ARE ABOKI BUREAU DE CHANGE?",
    a: "Aboki Bureau De Change is a premier financial services company with over 10 years of experience in foreign currency exchange and travel services. Aboki Bureau De Change exchanges foreign currencies from over 30 countries worldwide across our nationwide branches in Abuja, Lagos, Port Harcourt, Kano, Kaduna, and Bauchi.",
  },
  {
    q: "DOES ABOKI BUREAU DE CHANGE HAVE AN APP?",
    a: "Yes! ABOKI BUREAU DE CHANGE has got an APPLICATION that is available on Play Store - Android and App Store - iPhone for tracking live currency exchange rates and setting target rate alerts.",
  },
  {
    q: "WHAT ARE THE EXCHANGE RATES?",
    a: "Exchange rates are the rates at which one currency will be exchanged for another currency. The exchange rates at ABOKI BUREAU DE CHANGE are set daily by the bureau and updated in real time based on movements in the foreign currency market.",
  },
  {
    q: "DO YOU EXCHANGE FOREIGN COINS?",
    a: "ABOKI BUREAU DE CHANGE does not exchange COINS of any kind or from any country. ABOKI BUREAU DE CHANGE exclusively exchanges valid BANKNOTES (notes) of supported countries only.",
  },
  {
    q: "DOES ABOKI BDC OFFER UMRAH PACKAGES AND FLIGHT BOOKINGS?",
    a: "Yes! Through Aboki BDC Travels, we provide all-inclusive Executive and Economy Plus Umrah packages (Saudi E-Visa, return flights, 5-star Haramain hotels in Makkah & Madinah, and High-Speed Train transfers), domestic & international flight ticketing, Dubai/Egypt/Zanzibar tour packages, and visa assistance.",
  },
];

const NEWS_ITEMS = [
  {
    date: "May 2026",
    category: "Market Update",
    title: "Real-Time FX Transparency Across All Aboki BDC Branches",
    excerpt:
      "All branch buying and selling rates across Abuja, Lagos, Port Harcourt, Kano, Kaduna, and Bauchi are updated daily across our nationwide network.",
  },
  {
    date: "May 2026",
    category: "Aboki BDC Travels",
    title: "2026 Executive & Economy Plus Umrah Packages Now Open",
    excerpt:
      "Book your sacred pilgrimage to Makkah and Madinah with fast-track Saudi Umrah E-Visa processing, direct flights, and Haram-view accommodations.",
  },
  {
    date: "April 2026",
    category: "Customer Advisory",
    title: "USD, GBP, EUR, CAD, AED & SAR Denominations Available Nationwide",
    excerpt:
      "Visit any verified Aboki Bureau De Change branch or use our live branch calculator to lock in your exchange rate via WhatsApp before arrival.",
  },
];

export default function AbokiWebsite() {
  const location = useLocation();

  const [cityGroups, setCityGroups] = useState<CityData[]>(branchesData);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Converter state (Kadoo BDC style: Select Branch -> Select Type -> Amount -> Currency -> Convert)
  const [selectedConverterBranchId, setSelectedConverterBranchId] = useState<string>("");
  const [rateType, setRateType] = useState<"Buying" | "Selling">("Buying");
  const [amount, setAmount] = useState<string>("1000");
  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState<string>("USD");
  const [convertedResult, setConvertedResult] = useState<{
    totalNgn: number;
    unitRate: number;
    currencyCode: string;
    denomination?: string;
    branchName: string;
    type: "Buying" | "Selling";
  } | null>(null);

  // Market Rates Table state
  const [selectedMarketBranchId, setSelectedMarketBranchId] = useState<string>("");

  // Branches Directory city filter (Kadoo BDC style: All | Abuja | Lagos | ...)
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");

  // Selected branch for Google Map & details drawer
  const [activeBranchForModal, setActiveBranchForModal] = useState<Branch | null>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Appointment / Contact form state
  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    phone: "",
    branch: "",
    service: "Currency Exchange",
    message: "",
  });

  const fetchLiveDatabase = useCallback(async () => {
    try {
      const cityPriority: Record<string, number> = {
        ABUJA: 1,
        LAGOS: 2,
        "PORT HARCOURT": 3,
        KANO: 4,
        KADUNA: 5,
        BAUCHI: 6,
      };

      const [citiesRes, branchesRes, ratesRes] = await Promise.all([
        supabase.from("cities").select("id, name").eq("is_active", true),
        supabase
          .from("branches")
          .select(
            "id, name, address, city_id, whatsapp_number, operating_hours, rating, review_count, latitude, longitude"
          )
          .eq("is_active", true),
        supabase
          .from("branch_rates")
          .select(
            "branch_id, currency_id, denomination, buy_rate, sell_rate, currencies (code, name, flag_url)"
          ),
      ]);

      if (citiesRes.error) throw citiesRes.error;
      if (branchesRes.error) throw branchesRes.error;
      if (ratesRes.error) throw ratesRes.error;

      const sortedCities = [...(citiesRes.data || [])].sort((a, b) => {
        const pA = cityPriority[a.name.toUpperCase()] || 999;
        const pB = cityPriority[b.name.toUpperCase()] || 999;
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });

      const mappedGroups: CityData[] = sortedCities
        .map((city) => {
          const cityBranches = (branchesRes.data || []).filter(
            (b) => b.city_id === city.id
          );
          return {
            city: city.name.toUpperCase(),
            branches: cityBranches.map((branch) => {
              const branchRates = (ratesRes.data || []).filter(
                (r) => r.branch_id === branch.id
              );
              const coords = getBranchCoordinates({
                id: branch.id,
                city: city.name.toUpperCase(),
                latitude: (branch as any).latitude,
                longitude: (branch as any).longitude,
              });

              return {
                id: branch.id,
                name: branch.name,
                address: branch.address,
                city: city.name.toUpperCase(),
                whatsappNumber: branch.whatsapp_number || "+2347064937199",
                operatingHours: branch.operating_hours,
                rating: branch.rating,
                reviewCount: branch.review_count,
                latitude: coords.lat,
                longitude: coords.lng,
                currencies: branchRates.map((rate) => ({
                  code: (rate.currencies as any)?.code || "",
                  flag: (rate.currencies as any)?.flag_url || "",
                  buyRate: rate.buy_rate,
                  sellRate: rate.sell_rate,
                  denomination: rate.denomination || undefined,
                })),
              };
            }),
          };
        })
        .filter((g) => g.branches.length > 0);

      const finalGroups = mappedGroups.length > 0 ? mappedGroups : branchesData;
      setCityGroups(finalGroups);
    } catch (err) {
      console.error("Error loading live website data:", err);
      setCityGroups(branchesData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDatabase();
    const handleDbUpdate = () => {
      fetchLiveDatabase();
    };
    window.addEventListener("aboki-db-updated", handleDbUpdate);
    return () => window.removeEventListener("aboki-db-updated", handleDbUpdate);
  }, [fetchLiveDatabase]);

  // Flatten all branches across all cities
  const allBranches = useMemo(() => {
    return cityGroups.flatMap((group) => group.branches);
  }, [cityGroups]);

  // Initialize default branch selections once branches are loaded
  useEffect(() => {
    if (allBranches.length > 0) {
      if (
        !selectedConverterBranchId ||
        !allBranches.some((b) => b.id === selectedConverterBranchId)
      ) {
        setSelectedConverterBranchId(allBranches[0].id);
      }
      if (
        !selectedMarketBranchId ||
        !allBranches.some((b) => b.id === selectedMarketBranchId)
      ) {
        setSelectedMarketBranchId(allBranches[0].id);
      }
    }
  }, [allBranches, selectedConverterBranchId, selectedMarketBranchId]);

  const converterBranch = useMemo(() => {
    return (
      allBranches.find((b) => b.id === selectedConverterBranchId) ||
      allBranches[0] ||
      null
    );
  }, [allBranches, selectedConverterBranchId]);

  const marketBranch = useMemo(() => {
    return (
      allBranches.find((b) => b.id === selectedMarketBranchId) ||
      allBranches[0] ||
      null
    );
  }, [allBranches, selectedMarketBranchId]);

  // Keep converter currency key valid for the selected branch
  useEffect(() => {
    if (!converterBranch || converterBranch.currencies.length === 0) return;
    const keys = converterBranch.currencies.map(
      (c, idx) => `${c.code}__${c.denomination || idx}`
    );
    if (!keys.includes(selectedCurrencyKey)) {
      setSelectedCurrencyKey(keys[0]);
    }
  }, [converterBranch, selectedCurrencyKey]);

  // Auto-calculate conversion whenever branch, rateType, amount, or currency changes
  const runConversion = useCallback(() => {
    if (!converterBranch || converterBranch.currencies.length === 0) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setConvertedResult(null);
      return;
    }

    const foundCurrency =
      converterBranch.currencies.find(
        (c, idx) => `${c.code}__${c.denomination || idx}` === selectedCurrencyKey
      ) || converterBranch.currencies[0];

    if (!foundCurrency) return;

    const unitRate =
      rateType === "Buying" ? foundCurrency.buyRate : foundCurrency.sellRate;
    const totalNgn = parsedAmount * unitRate;

    setConvertedResult({
      totalNgn,
      unitRate,
      currencyCode: foundCurrency.code,
      denomination: foundCurrency.denomination,
      branchName: converterBranch.name,
      type: rateType,
    });
  }, [converterBranch, amount, selectedCurrencyKey, rateType]);

  useEffect(() => {
    runConversion();
  }, [runConversion]);

  // Scroll to section if route matches /about, /market-rates, /branch, /faq, /news, /contact-us
  useEffect(() => {
    const pathToSection: Record<string, string> = {
      "/about": "about-section",
      "/market-rates": "rates-section",
      "/branch": "branches-section",
      "/faq": "faq-section",
      "/news": "news-section",
      "/contact-us": "contact-section",
    };
    const targetId = pathToSection[location.pathname];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredBranches = useMemo(() => {
    if (selectedCityFilter === "ALL") return allBranches;
    return allBranches.filter(
      (b) => b.city.toUpperCase() === selectedCityFilter.toUpperCase()
    );
  }, [allBranches, selectedCityFilter]);

  const handleOpenBranchMap = (branch: Branch) => {
    setActiveBranchForModal(branch);
    setBranchModalOpen(true);
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `Hello Aboki Bureau De Change!`,
      `I would like to book an appointment / inquiry from the Official Website:`,
      `Name: ${appointmentForm.name || "Customer"}`,
      `Phone: ${appointmentForm.phone || "N/A"}`,
      `Service: ${appointmentForm.service}`,
      appointmentForm.branch ? `Preferred Branch: ${appointmentForm.branch}` : "",
      appointmentForm.message ? `Message: ${appointmentForm.message}` : "",
    ].filter(Boolean);

    window.open(
      `https://wa.me/2347064937199?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
    toast({
      title: "Connecting to Aboki BDC Desk",
      description: "Opening WhatsApp to confirm your appointment.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ==================== TOP BAR (Kadoo BDC Header Top Area) ==================== */}
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

      {/* ==================== MAIN NAVIGATION BAR ==================== */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => scrollToSection("hero-section")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img
              src={abokiLogo}
              alt="Aboki Bureau De Change"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-red-600/30 shadow-sm shrink-0"
            />
            <div>
              <h1 className="font-['Playfair_Display',Georgia,serif] font-black text-lg sm:text-xl text-slate-950 tracking-tight leading-none">
                ABOKI BUREAU DE CHANGE
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mt-1">
                Trusted FX & Global Travels
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (Kadoo BDC Menu) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-700">
            <button
              type="button"
              onClick={() => scrollToSection("hero-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("rates-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              Rates
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("branches-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              Branches
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("travels-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide flex items-center gap-1 text-red-600"
            >
              <Moon className="w-3.5 h-3.5" />
              Travels & Umrah
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("news-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              News
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact-section")}
              className="hover:text-red-600 transition-colors uppercase tracking-wide"
            >
              Contact
            </button>
          </nav>

          {/* CTA Button: MAKE AN APPOINTMENT */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("contact-section")}
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
            >
              <span>Make An Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-2 shadow-lg">
            {[
              { label: "HOME", id: "hero-section" },
              { label: "ABOUT", id: "about-section" },
              { label: "RATES", id: "rates-section" },
              { label: "BRANCHES", id: "branches-section" },
              { label: "TRAVELS & UMRAH", id: "travels-section" },
              { label: "FAQ", id: "faq-section" },
              { label: "NEWS", id: "news-section" },
              { label: "CONTACT", id: "contact-section" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-slate-800 hover:bg-red-50 hover:text-red-600"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ==================== HERO & CONVERTER AREA (Kadoo BDC Clone) ==================== */}
      <section
        id="hero-section"
        className="relative bg-slate-950 text-white overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=1600&q=80"
          alt="Foreign Currency Exchange"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-red-950/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                At Aboki BDC, We Provide Real-Time Currency Exchange Rates
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-['Playfair_Display',Georgia,serif] font-black leading-tight text-white">
                Welcome to{" "}
                <span className="text-red-500">ABOKI BUREAU DE CHANGE</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                We take pride in exceeding our clients' expectations by providing foreign exchange and global travel services using a wide array of innovative solutions across all our branches in Nigeria.
              </p>

              {/* Quick Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <p className="text-2xl font-black text-white">30+</p>
                  <p className="text-xs text-slate-400">Global Currencies</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-500">
                    {allBranches.length}
                  </p>
                  <p className="text-xs text-slate-400">Verified Branches</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-400">100%</p>
                  <p className="text-xs text-slate-400">Fast, Safe & Reliable</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection("rates-section")}
                  className="px-5 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Live Market Rates
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("branches-section")}
                  className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-red-400" />
                  Locate Nearest Branch
                </button>
              </div>
            </div>

            {/* Hero Right: Kadoo BDC Live Branch Currency Converter Box */}
            <div className="lg:col-span-6">
              <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calculator className="w-5 h-5" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider">
                        Currency Conversion
                      </h3>
                      <p className="text-[11px] text-red-100">
                        Instant calculation using real-time branch rates
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchLiveDatabase}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                    title="Refresh live rates"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Select Branch (exact Kadoo BDC field) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Select Branch
                      </label>
                      <select
                        value={selectedConverterBranchId}
                        onChange={(e) => setSelectedConverterBranchId(e.target.value)}
                        aria-label="Select Branch"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {allBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name.toUpperCase()} ({b.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Select Type: Buying / Selling (exact Kadoo BDC field) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Select Type
                      </label>
                      <select
                        value={rateType}
                        onChange={(e) =>
                          setRateType(e.target.value as "Buying" | "Selling")
                        }
                        aria-label="Select Rate Type"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="Buying">Buying (We Buy From You)</option>
                        <option value="Selling">Selling (We Sell To You)</option>
                      </select>
                    </div>

                    {/* 3. Amount Input (exact Kadoo BDC field) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount (e.g. 1000)"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    {/* 4. Select Currency (exact Kadoo BDC field) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Currency
                      </label>
                      <select
                        value={selectedCurrencyKey}
                        onChange={(e) => setSelectedCurrencyKey(e.target.value)}
                        aria-label="Select Currency"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {(converterBranch?.currencies || []).map((curr, idx) => {
                          const key = `${curr.code}__${curr.denomination || idx}`;
                          const fullName = CURRENCY_NAMES[curr.code] || curr.code;
                          return (
                            <option key={key} value={key}>
                              {curr.code} - {fullName}
                              {curr.denomination ? ` (${curr.denomination})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Convert Button */}
                  <button
                    type="button"
                    onClick={runConversion}
                    className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Convert Now
                  </button>

                  {/* Conversion Output Box (Kadoo BDC alertSuccess style) */}
                  {convertedResult && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          Converted Amount in NGN ({convertedResult.type} @{" "}
                          {convertedResult.branchName})
                        </p>
                        <p className="text-2xl font-black text-emerald-700 mt-0.5">
                          ₦{convertedResult.totalNgn.toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-800/80 mt-0.5">
                          Rate: 1 {convertedResult.currencyCode}{" "}
                          {convertedResult.denomination
                            ? `(${convertedResult.denomination})`
                            : ""}{" "}
                          = ₦{convertedResult.unitRate.toLocaleString()}
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/${
                          converterBranch?.whatsappNumber.replace(/[^0-9]/g, "") ||
                          "2347064937199"
                        }?text=${encodeURIComponent(
                          `Hello Aboki BDC (${convertedResult.branchName})! I want to exchange ${amount} ${
                            convertedResult.currencyCode
                          } (${convertedResult.type}) at ₦${convertedResult.unitRate.toLocaleString()} = ₦${convertedResult.totalNgn.toLocaleString()}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Lock Rate on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== LIVE MARKET RATES BOARD (Kadoo /market-rates Clone) ==================== */}
      <section id="rates-section" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                Real-Time Market Rates Board
              </span>
              <h2 className="text-2xl sm:text-3xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900 mt-1">
                Today's Foreign Exchange Rates
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Select any Aboki Bureau De Change branch below to view live buying and selling rates.
              </p>
            </div>

            {/* Select Branch Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Branch:
              </label>
              <select
                value={selectedMarketBranchId}
                onChange={(e) => setSelectedMarketBranchId(e.target.value)}
                aria-label="Select Branch for Market Rates"
                className="h-10 px-3.5 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name.toUpperCase()} — {b.city}
                  </option>
                ))}
              </select>

              {marketBranch && (
                <button
                  type="button"
                  onClick={() => handleOpenBranchMap(marketBranch)}
                  className="h-10 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  Branch Map & Info
                </button>
              )}
            </div>
          </div>

          {/* Kadoo-Style Market Rates Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-400" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  {marketBranch?.name} ({marketBranch?.city})
                </span>
              </div>
              <span className="text-xs text-slate-300">
                {marketBranch?.address} • {marketBranch?.operatingHours}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">Currency</th>
                    <th className="py-3.5 px-6">Code / Denomination</th>
                    <th className="py-3.5 px-6 text-center">Buying (NGN)</th>
                    <th className="py-3.5 px-6 text-center">Selling (NGN)</th>
                    <th className="py-3.5 px-6 text-right">Trade Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {(marketBranch?.currencies || []).map((curr, index) => (
                    <tr
                      key={`${curr.code}-${curr.denomination || index}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/28x21/${getFlagCode(curr.code)}.png`}
                            alt={curr.code}
                            className="w-7 h-5 object-cover rounded-xs shadow-2xs"
                          />
                          <div>
                            <p className="font-bold text-slate-900">
                              {CURRENCY_NAMES[curr.code] || curr.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                          {curr.code}
                          {curr.denomination ? ` • ${curr.denomination}` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="text-base font-extrabold text-emerald-600">
                          ₦{curr.buyRate.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="text-base font-extrabold text-red-600">
                          ₦{curr.sellRate.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <a
                          href={`https://wa.me/${
                            marketBranch?.whatsappNumber.replace(/[^0-9]/g, "") ||
                            "2347064937199"
                          }?text=${encodeURIComponent(
                            `Hello ${marketBranch?.name}! I want to trade ${curr.code} ${
                              curr.denomination ? `(${curr.denomination})` : ""
                            } at Buy: ₦${curr.buyRate.toLocaleString()} / Sell: ₦${curr.sellRate.toLocaleString()}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Exchange Now
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DOWNLOAD APP BANNER (Kadoo BDC Download App Area) ==================== */}
      <section className="bg-gradient-to-r from-red-700 via-red-600 to-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl text-center lg:text-left">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-300">
              Mobile Experience • Android & iOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-['Playfair_Display',Georgia,serif] font-black leading-snug">
              Explore Exchange Rates From 30+ Countries Worldwide, Download The "ABOKI BUREAU DE CHANGE APPLICATION"
            </h2>
            <p className="text-xs sm:text-sm text-red-100">
              Track real-time BDC & CBN rates, set custom target rate alerts, locate branches on Google Maps, and book Umrah & flights on the go.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              Google Play Store
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-2"
            >
              Apple App Store
            </a>
          </div>
        </div>
      </section>

      {/* ==================== BRANCHES DIRECTORY ("Creating Endless Smiles" - Kadoo Product Area) ==================== */}
      <section id="branches-section" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              Nationwide Branch Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900">
              Creating Endless Smiles
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Make a smooth and safe exchange at your nearest branch today.{" "}
              <strong className="text-slate-900">ABOKI BUREAU DE CHANGE</strong>{" "}
              strives to attain customer delight and excellent customer experience in foreign currency exchange across major regions in Nigeria.{" "}
              <strong className="text-red-600">
                ABOKI BUREAU DE CHANGE, we're just a call away.
              </strong>
            </p>
          </div>

          {/* Kadoo-style City Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCityFilter("ALL")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                selectedCityFilter === "ALL"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-red-300"
              }`}
            >
              All ({allBranches.length})
            </button>
            {cityGroups.map((group) => (
              <button
                key={group.city}
                type="button"
                onClick={() => setSelectedCityFilter(group.city)}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                  selectedCityFilter === group.city
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-red-300"
                }`}
              >
                {group.city} ({group.branches.length})
              </button>
            ))}
          </div>

          {/* Branch Cards Grid (Kadoo BDC Branch Cards + Live Rates & Google Map Trigger) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => {
              const topCurrencies = branch.currencies.slice(0, 3);
              return (
                <div
                  key={branch.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-red-300 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 mb-1">
                          {branch.city}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 uppercase">
                          {branch.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {branch.rating}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <p className="flex items-start gap-2">
                        <Phone className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-800">Phone Number:</strong>{" "}
                          {branch.whatsappNumber || "+2347064937199"}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-800">Branch Location:</strong>{" "}
                          {branch.address}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-800">Hours:</strong>{" "}
                          {branch.operatingHours}
                        </span>
                      </p>
                    </div>

                    {/* Mini Live Rate Preview */}
                    {topCurrencies.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                        <div className="grid grid-cols-3 text-[10px] font-bold uppercase text-slate-400 pb-1 border-b border-slate-200">
                          <span>Currency</span>
                          <span className="text-center">Buy</span>
                          <span className="text-center">Sell</span>
                        </div>
                        {topCurrencies.map((c, i) => (
                          <div
                            key={`${c.code}-${i}`}
                            className="grid grid-cols-3 text-xs font-semibold py-0.5"
                          >
                            <span className="font-bold text-slate-800">
                              {c.code}
                            </span>
                            <span className="text-center text-emerald-600">
                              ₦{c.buyRate.toLocaleString()}
                            </span>
                            <span className="text-center text-red-600">
                              ₦{c.sellRate.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBranchMap(branch)}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      Google Map & All Rates
                    </button>

                    <a
                      href={`https://wa.me/${branch.whatsappNumber.replace(
                        /[^0-9]/g,
                        ""
                      )}?text=${encodeURIComponent(
                        `Hello ${branch.name}! I'm inquiring about today's exchange rates.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1"
                      title="WhatsApp Branch"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== ABOKI BDC TRAVELS & UMRAH SECTION ==================== */}
      <section
        id="travels-section"
        className="py-16 bg-slate-950 text-white border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-400">
                <Moon className="w-4 h-4" />
                Aboki BDC Travels • Sacred Pilgrimage & Global Aviation
              </span>
              <h2 className="text-3xl sm:text-4xl font-['Playfair_Display',Georgia,serif] font-black mt-1">
                Umrah Packages, Flight Ticketing & Holiday Tours
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Seamless Naira and foreign currency settlement for your Umrah pilgrimage, international flight bookings, luxury hotels, and visa assistance.
              </p>
            </div>
            <a
              href="https://wa.me/2347064937199?text=Hello%20Aboki%20BDC%20Travels!%20I%20would%20like%20to%20inquire%20about%20Umrah%20and%20Flight%20packages."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 self-start"
            >
              <Plane className="w-4 h-4" />
              Book with Travel Desk
            </a>
          </div>

          {/* Featured Umrah & Tour Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: VIP Umrah */}
            <div className="rounded-2xl bg-slate-900 border-2 border-amber-500/40 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-48">
                  <img
                    src="https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=900&q=80"
                    alt="Executive Haramain Umrah"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded">
                    5-Star VIP Umrah
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white">
                    Executive Haramain Umrah (10 Days)
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Saudi Umrah E-Visa & Return Flights Included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      5-Star Clock Tower / Haram View Hotels
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Haramain High-Speed Train & Guided Ziyarah
                    </li>
                  </ul>
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Package From
                  </span>
                  <span className="text-lg font-black text-amber-400">
                    ₦3,450,000
                  </span>
                </div>
                <a
                  href="https://wa.me/2347064937199?text=Hello%20Aboki%20BDC%20Travels!%20I%20want%20to%20book%20the%20Executive%20Haramain%20Umrah%20Package."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Reserve Slot
                </a>
              </div>
            </div>

            {/* Card 2: Economy Plus Umrah */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-48">
                  <img
                    src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=900&q=80"
                    alt="Economy Plus Umrah"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded">
                    4-Star Comfort Umrah
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white">
                    Economy Plus Umrah Package (14 Days)
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Fast-Track Saudi Umrah Visa & Return Ticket
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Walking-Distance Makkah & Madinah Hotels
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Full Ground VIP Bus Transfers & Scholar Guidance
                    </li>
                  </ul>
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Package From
                  </span>
                  <span className="text-lg font-black text-white">
                    ₦2,350,000
                  </span>
                </div>
                <a
                  href="https://wa.me/2347064937199?text=Hello%20Aboki%20BDC%20Travels!%20I%20want%20to%20book%20the%20Economy%20Plus%20Umrah%20Package."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Reserve Slot
                </a>
              </div>
            </div>

            {/* Card 3: Global Flights & Tours */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-48">
                  <img
                    src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80"
                    alt="Dubai, London & Cairo Flights"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded">
                    Flights & Holiday Tours
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white">
                    Domestic & International Flight Deals
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      Abuja ⇄ Lagos (From ₦155,900) & Enugu (₦238,502)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      Abuja ⇄ Cairo, London, Dubai & Jeddah Deals
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      Magical Dubai, Egypt & Zanzibar Vacation Packages
                    </li>
                  </ul>
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Domestic & Global
                  </span>
                  <span className="text-lg font-black text-white">
                    From ₦155,900
                  </span>
                </div>
                <a
                  href="https://wa.me/2347064937199?text=Hello%20Aboki%20BDC%20Travels!%20I%20want%20to%20book%20a%20flight%20or%20holiday%20package."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Get Flight Quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ABOUT US SECTION ==================== */}
      <section id="about-section" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                About Aboki Bureau De Change
              </span>
              <h2 className="text-3xl sm:text-4xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900 leading-tight">
                Nigeria's Trusted Foreign Exchange & Travel Institution
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Aboki Bureau De Change Limited is a premier financial services institution providing foreign currency exchange across Nigeria. For over a decade, we have delivered transparent, secure, and real-time foreign currency exchange for individuals, travelers, diplomats, and corporate organizations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <Award className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Trusted & Transparent
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Competitive market rates, verified banknotes, and strict customer security standards.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <Users className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Retail, Travel & Corporate Desk
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Instant cash note exchange, PTA/BTA guidance, Umrah pilgrimage packages, and global flight ticketing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80"
                  alt="Aboki Bureau De Change Office"
                  className="w-full h-80 object-cover"
                />
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-red-400 font-bold">
                      Verified Nationwide Service
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      Serving Individual, Corporate & Diplomatic Clients Across Nigeria
                    </p>
                  </div>
                  <Globe className="w-8 h-8 text-red-500 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ AREA (Exact Kadoo BDC FAQ Clone) ==================== */}
      <section id="faq-section" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              FAQ'S
            </span>
            <h2 className="text-3xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900">
              Frequently Asked Any Question?
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-red-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== NEWS AREA ==================== */}
      <section id="news-section" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              Market Updates & Announcements
            </span>
            <h2 className="text-3xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900">
              Latest News From Aboki BDC
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NEWS_ITEMS.map((news) => (
              <div
                key={news.title}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase text-red-600">
                      {news.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {news.date}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {news.excerpt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection("rates-section")}
                  className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  Check Today's Live Rates <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CONTACT & APPOINTMENT SECTION ==================== */}
      <section id="contact-section" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                Get In Touch
              </span>
              <h2 className="text-3xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900">
                Contact Aboki Bureau De Change
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Have a high-volume currency transaction, corporate treasury inquiry, or Umrah/Flight booking? Reach our head office desk or book a branch appointment below.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
                  <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Head Office
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      Plot 123, Wuse Zone 4, Behind Sheraton Hotel, Abuja, FCT
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
                  <Phone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Service Line & WhatsApp
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      +2347064937199
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
                  <Mail className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Support Email
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      abokibdcs@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleAppointmentSubmit}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
              >
                <h3 className="text-lg font-extrabold text-slate-900 uppercase">
                  Make An Appointment / Lock Exchange Rate
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={appointmentForm.name}
                      onChange={(e) =>
                        setAppointmentForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Your full name"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={appointmentForm.phone}
                      onChange={(e) =>
                        setAppointmentForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+234 800 000 0000"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Branch
                    </label>
                    <select
                      value={appointmentForm.branch}
                      onChange={(e) =>
                        setAppointmentForm((p) => ({ ...p, branch: e.target.value }))
                      }
                      aria-label="Preferred Branch"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="">Any Nearest Branch</option>
                      {allBranches.map((b) => (
                        <option key={b.id} value={`${b.name} (${b.city})`}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Needed
                    </label>
                    <select
                      value={appointmentForm.service}
                      onChange={(e) =>
                        setAppointmentForm((p) => ({ ...p, service: e.target.value }))
                      }
                      aria-label="Service Needed"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="Currency Exchange (Buy/Sell)">
                        Currency Exchange (Buy/Sell)
                      </option>
                      <option value="Corporate Bulk FX">Corporate Bulk FX</option>
                      <option value="Umrah Package Booking">
                        Umrah Package Booking
                      </option>
                      <option value="Flight Ticketing & Visa">
                        Flight Ticketing & Visa
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount / Inquiry Details
                  </label>
                  <textarea
                    rows={3}
                    value={appointmentForm.message}
                    onChange={(e) =>
                      setAppointmentForm((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder="Specify currency, amount, or travel dates..."
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Submit & Confirm on WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER AREA (Kadoo BDC Footer Clone) ==================== */}
      <footer className="bg-slate-950 text-slate-300 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-800">
            {/* Column 1: ABOUT */}
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

            {/* Column 2: CONTACTS */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
                Contacts
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Wuse Zone 4, Behind Sheraton Hotel, Abuja, FCT</span>
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

            {/* Column 3: QUICK LINKS */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => scrollToSection("hero-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("about-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  About Us
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("rates-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  Market Rates
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("branches-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  Branches
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("travels-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  Travels & Umrah
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("contact-section")}
                  className="text-left text-slate-400 hover:text-white"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-slate-500">
            <p>
              Copyright © {new Date().getFullYear()} Aboki Bureau De Change | All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Branch Detail Drawer with Interactive Google Map & Rates */}
      <BranchDetailSheet
        branch={activeBranchForModal}
        open={branchModalOpen}
        onOpenChange={setBranchModalOpen}
      />
    </div>
  );
}
