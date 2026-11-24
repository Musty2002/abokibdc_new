import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  Building2,
  CheckCircle2,
  Star,
} from "lucide-react";
import WebsitePageLayout from "./WebsitePageLayout";
import { Branch, branchesData, getBranchCoordinates } from "@/data/branchesData";
import { supabase } from "@/integrations/supabase/client";
import BranchDetailSheet from "@/components/rates/BranchDetailSheet";
import { toast } from "@/hooks/use-toast";

const SUPPORT_WHATSAPP = "2347064937199";
const SUPPORT_EMAIL = "abokibdcs@gmail.com";

export default function ContactUsPage() {
  const [branches, setBranches] = useState<Branch[]>(() =>
    branchesData.flatMap((g) => g.branches)
  );
  const [selectedBranchModal, setSelectedBranchModal] = useState<Branch | null>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    department: "Currency Exchange (Buy/Sell)",
    branch: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const [citiesRes, branchesRes, ratesRes] = await Promise.all([
        supabase.from("cities").select("id, name").eq("is_active", true),
        supabase.from("branches").select("*").eq("is_active", true).order("name"),
        supabase
          .from("branch_rates")
          .select("branch_id, buy_rate, sell_rate, denomination, currencies(code, flag_url)"),
      ]);

      if (citiesRes.data && branchesRes.data && branchesRes.data.length > 0) {
        const cityMap = new Map<string, string>(
          citiesRes.data.map((c: any) => [String(c.id), String(c.name || "").toUpperCase()])
        );
        const mapped: Branch[] = branchesRes.data.map((b: any) => {
          const city: string = cityMap.get(String(b.city_id)) || "NIGERIA";
          const coords = getBranchCoordinates({
            id: b.id,
            city,
            latitude: (b as any).latitude,
            longitude: (b as any).longitude,
          });
          const branchRates = (ratesRes.data || []).filter((r) => r.branch_id === b.id);

          return {
            id: b.id,
            name: b.name,
            address: b.address,
            city,
            whatsappNumber: b.whatsapp_number || "+2347064937199",
            operatingHours: b.operating_hours,
            rating: b.rating,
            reviewCount: b.review_count,
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
        });
        setBranches(mapped);
      }
    } catch (err) {
      console.error("Failed loading branches on Contact page:", err);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const buildWhatsAppLink = () => {
    const lines = [
      `Hello Aboki Bureau De Change!`,
      `Contact Form Inquiry:`,
      `Name: ${formData.name || "Customer"}`,
      `Phone: ${formData.phone || "N/A"}`,
      formData.email ? `Email: ${formData.email}` : "",
      `Department: ${formData.department}`,
      formData.branch ? `Preferred Branch: ${formData.branch}` : "",
      formData.message ? `Message: ${formData.message}` : "",
    ].filter(Boolean);

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  const buildEmailLink = () => {
    const subject = `Website Inquiry: ${formData.department} - ${formData.name}`;
    const body = [
      `Name: ${formData.name}`,
      `Phone / WhatsApp: ${formData.phone}`,
      formData.email ? `Email: ${formData.email}` : "",
      `Department: ${formData.department}`,
      formData.branch ? `Preferred Branch: ${formData.branch}` : "",
      `Message:\n${formData.message}`,
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Missing Details",
        description: "Please provide your name and phone number.",
        variant: "destructive",
      });
      return;
    }
    setSubmitted(true);
    toast({
      title: "Message Ready to Send",
      description: "Choose WhatsApp for instant response or Email our support desk.",
    });
  };

  return (
    <WebsitePageLayout
      title="Contact Us"
      subtitle="Reach our head office in Abuja, connect with any nationwide branch desk, or schedule an appointment for foreign exchange and Umrah/travel services."
      breadcrumb="Contact Us"
      badge="24/7 WhatsApp Desk & Nationwide Branches"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-14">
        {/* Top Direct Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Head Office
            </h3>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              Plot 123, Wuse Zone 4, Behind Sheraton Hotel, Abuja, FCT
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Service Line & WhatsApp
            </h3>
            <a
              href="tel:+2347064937199"
              className="block text-sm font-bold text-slate-900 hover:text-red-600"
            >
              +2347064937199
            </a>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat on WhatsApp →
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Support Email
            </h3>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="block text-sm font-bold text-slate-900 hover:text-red-600 break-all"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-slate-500">
              FX, Travel Desk & Privacy Support
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Operating Hours
            </h3>
            <p className="text-xs font-semibold text-slate-800">
              Mon – Fri: 8:00 AM – 6:00 PM
            </p>
            <p className="text-xs font-semibold text-slate-800">
              Saturday: 9:00 AM – 4:00 PM
            </p>
            <p className="text-xs text-slate-500">Sunday: Closed</p>
          </div>
        </div>

        {/* Contact Form + Direct Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="space-y-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Inquiry Prepared for {formData.name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Choose your preferred channel below to send your message directly to our Aboki Bureau De Change support desk.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-1.5 text-slate-700">
                  <p>
                    <strong>Department:</strong> {formData.department}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone}
                  </p>
                  {formData.branch && (
                    <p>
                      <strong>Preferred Branch:</strong> {formData.branch}
                    </p>
                  )}
                  {formData.message && (
                    <p>
                      <strong>Message:</strong> {formData.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send Instantly on WhatsApp
                  </a>
                  <a
                    href={buildEmailLink()}
                    className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send via Email
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  ← Edit or Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                    Direct Message & Appointment
                  </span>
                  <h2 className="text-2xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900 mt-1">
                    Send Us a Message
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+234 800 000 0000"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Service
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                      aria-label="Department or Service"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="Currency Exchange (Buy/Sell)">
                        Currency Exchange (Buy/Sell)
                      </option>
                      <option value="Corporate Bulk FX">Corporate Bulk FX</option>
                      <option value="Umrah Package Booking">Umrah Package Booking</option>
                      <option value="Flight Ticketing & Visa">Flight Ticketing & Visa</option>
                      <option value="Customer Support / Privacy Request">
                        Customer Support / Privacy Request
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Branch (Optional)
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}
                    aria-label="Preferred Branch"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Any Nearest Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={`${b.name} (${b.city})`}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us the currency & amount you want to exchange, your travel inquiry, or how we can help..."
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Continue to Send Inquiry
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Instant Support Box */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Fast Response Desk
              </span>
              <h3 className="text-2xl font-['Playfair_Display',Georgia,serif] font-black">
                Prefer Instant WhatsApp Support?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Speak directly with our Abuja Head Office currency desk or Aboki BDC Travels consultants for live bulk FX quotes, Umrah package availability, and flight bookings.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
                    "Hello Aboki Bureau De Change! I would like to speak with customer support."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp: +2347064937199
                </a>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-red-400" />
                  Email: {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Nationwide Branches Directory with Google Map Access */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              Visit Us In Person
            </span>
            <h2 className="text-2xl sm:text-3xl font-['Playfair_Display',Georgia,serif] font-black text-slate-900 mt-1">
              Our Branch Offices Nationwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 mb-1">
                        {branch.city}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                        {branch.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {branch.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{branch.whatsappNumber}</span>
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.operatingHours}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranchModal(branch);
                      setBranchModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    Google Map & Rates
                  </button>
                  <a
                    href={`https://wa.me/${branch.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BranchDetailSheet
        branch={selectedBranchModal}
        open={branchModalOpen}
        onOpenChange={setBranchModalOpen}
      />
    </WebsitePageLayout>
  );
}
