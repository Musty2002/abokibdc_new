import { useState } from "react";
import {
  Plane,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Mail,
  Calendar,
  Users,
  MapPin,
  Send,
  RotateCcw,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ABOKI_TRAVELS_WHATSAPP = "2347064937199";
const ABOKI_TRAVELS_EMAIL = "abokibdcs@gmail.com";

const SERVICE_OPTIONS = [
  "Executive Haramain Umrah Package (5-Star VIP)",
  "Economy Plus Umrah Package (4-Star Comfort)",
  "International Flight Ticket",
  "Domestic Flight Ticket",
  "Visa Assistance (Saudi / UAE / UK / Schengen)",
  "Hotel Reservation",
  "Holiday & Vacation Tour Package",
];

const DEPARTURE_CITIES = [
  "Abuja (ABV)",
  "Lagos (LOS)",
  "Kano (KAN)",
  "Port Harcourt (PHC)",
  "Kaduna (KAD)",
  "Enugu (ENU)",
  "Other City",
];

interface TravelBookingFormProps {
  source: "mobile_app" | "website";
  variant?: "mobile" | "website";
  defaultService?: string;
}

interface SubmittedReceipt {
  referenceCode: string;
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  departureCity: string;
  destination: string;
  travelDate: string;
  returnDate: string;
  passengers: number;
  notes: string;
}

export default function TravelBookingForm({
  source,
  variant = "mobile",
  defaultService = SERVICE_OPTIONS[0],
}: TravelBookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState(defaultService);
  const [departureCity, setDepartureCity] = useState("Abuja (ABV)");
  const [destination, setDestination] = useState("Makkah & Madinah (Jeddah)");
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmittedReceipt | null>(null);

  const isWebsite = variant === "website";

  const buildWhatsAppUrl = (data: SubmittedReceipt) => {
    const lines = [
      `Hello Aboki BDC Travels! ✈️`,
      `Booking Reference: *${data.referenceCode}*`,
      `Service: *${data.serviceType}*`,
      `Full Name: ${data.fullName}`,
      `Phone: ${data.phone}`,
      data.email ? `Email: ${data.email}` : "",
      `Route: ${data.departureCity} → ${data.destination}`,
      `Departure Date: ${data.travelDate}`,
      data.returnDate ? `Return Date: ${data.returnDate}` : "",
      `Travelers: ${data.passengers}`,
      data.notes ? `Notes: ${data.notes}` : "",
    ].filter(Boolean);

    return `https://wa.me/${ABOKI_TRAVELS_WHATSAPP}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
  };

  const buildMailtoUrl = (data: SubmittedReceipt) => {
    const subject = `Travel Booking Request (${data.referenceCode}) - ${data.serviceType}`;
    const body = [
      `Booking Reference: ${data.referenceCode}`,
      `Service: ${data.serviceType}`,
      `Full Name: ${data.fullName}`,
      `Phone / WhatsApp: ${data.phone}`,
      data.email ? `Email: ${data.email}` : "",
      `Departure City: ${data.departureCity}`,
      `Destination: ${data.destination}`,
      `Departure Date: ${data.travelDate}`,
      data.returnDate ? `Return Date: ${data.returnDate}` : "",
      `Travelers: ${data.passengers}`,
      data.notes ? `Special Requests: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${ABOKI_TRAVELS_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleOpenExternal = async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanDestination = destination.trim();

    if (cleanName.length < 2) {
      toast({
        title: "Full Name Required",
        description: "Please enter your full name as shown on your passport.",
        variant: "destructive",
      });
      return;
    }

    if (cleanPhone.length < 5) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone or WhatsApp number.",
        variant: "destructive",
      });
      return;
    }

    if (!cleanDestination || !travelDate) {
      toast({
        title: "Trip Details Missing",
        description: "Please enter your destination and preferred travel date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const referenceCode = `ABK-${randomDigits}`;
      const passengerCount = Math.max(1, Math.min(50, parseInt(passengers, 10) || 1));

      const { error } = await supabase.from("travel_inquiries").insert({
        reference_code: referenceCode,
        full_name: cleanName.slice(0, 120),
        phone: cleanPhone.slice(0, 40),
        email: email.trim() ? email.trim().slice(0, 160) : null,
        service_type: serviceType.slice(0, 120),
        departure_city: departureCity.slice(0, 80),
        destination: cleanDestination.slice(0, 120),
        travel_date: travelDate.slice(0, 40),
        return_date: returnDate.trim() ? returnDate.trim().slice(0, 40) : null,
        passengers: passengerCount,
        notes: notes.trim() ? notes.trim().slice(0, 600) : null,
        source,
        status: "pending",
      });

      if (error) {
        throw error;
      }

      const submitted: SubmittedReceipt = {
        referenceCode,
        fullName: cleanName,
        phone: cleanPhone,
        email: email.trim(),
        serviceType,
        departureCity,
        destination: cleanDestination,
        travelDate,
        returnDate: returnDate.trim(),
        passengers: passengerCount,
        notes: notes.trim(),
      };

      setReceipt(submitted);

      toast({
        title: "Travel Request Submitted!",
        description: `Ref ${referenceCode} saved. Our Aboki BDC Travels desk will reach out shortly.`,
      });
    } catch (err: any) {
      console.error("Travel inquiry submit error:", err);
      toast({
        title: "Submission Error",
        description: err?.message || "Could not submit your travel form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setReceipt(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setReturnDate("");
    setPassengers("1");
    setNotes("");
  };

  if (receipt) {
    const whatsappHref = buildWhatsAppUrl(receipt);
    const mailtoHref = buildMailtoUrl(receipt);

    return (
      <div
        className={
          isWebsite
            ? "rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-6 sm:p-8 text-white space-y-5"
            : "rounded-xl bg-card border-2 border-emerald-500/40 p-4 space-y-4 shadow-sm"
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Booking Request Received
            </span>
            <h3
              className={
                isWebsite
                  ? "text-xl font-extrabold text-white mt-0.5"
                  : "text-base font-bold text-card-foreground mt-0.5"
              }
            >
              Reference: {receipt.referenceCode}
            </h3>
            <p
              className={
                isWebsite
                  ? "text-xs text-slate-300 mt-1"
                  : "text-xs text-muted-foreground mt-1"
              }
            >
              Your request has been sent to the Aboki BDC Travels desk. For instant confirmation and fare lock, tap WhatsApp below.
            </p>
          </div>
        </div>

        <div
          className={
            isWebsite
              ? "rounded-xl bg-slate-950/70 border border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs"
              : "rounded-lg bg-muted/50 border border-border p-3 space-y-1.5 text-xs"
          }
        >
          <p>
            <span className="opacity-65">Traveler:</span>{" "}
            <strong className="font-semibold">{receipt.fullName}</strong>
          </p>
          <p>
            <span className="opacity-65">Phone:</span>{" "}
            <strong className="font-semibold">{receipt.phone}</strong>
          </p>
          <p>
            <span className="opacity-65">Service:</span>{" "}
            <strong className="font-semibold">{receipt.serviceType}</strong>
          </p>
          <p>
            <span className="opacity-65">Route:</span>{" "}
            <strong className="font-semibold">
              {receipt.departureCity} → {receipt.destination}
            </strong>
          </p>
          <p>
            <span className="opacity-65">Travel Date:</span>{" "}
            <strong className="font-semibold">
              {receipt.travelDate}
              {receipt.returnDate ? ` to ${receipt.returnDate}` : ""}
            </strong>
          </p>
          <p>
            <span className="opacity-65">Travelers:</span>{" "}
            <strong className="font-semibold">{receipt.passengers}</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {Capacitor.isNativePlatform() ? (
            <button
              type="button"
              onClick={() => handleOpenExternal(whatsappHref)}
              className="flex-1 h-10 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm Fast on WhatsApp
            </button>
          ) : (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm Fast on WhatsApp
            </a>
          )}

          <a
            href={mailtoHref}
            className={
              isWebsite
                ? "h-10 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                : "h-10 px-4 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            }
          >
            <Mail className="w-4 h-4" />
            Email Copy
          </a>

          <button
            type="button"
            onClick={handleResetForm}
            className={
              isWebsite
                ? "h-10 px-4 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                : "h-10 px-4 rounded-lg border border-border hover:bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            }
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isWebsite
          ? "rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl"
          : "rounded-xl bg-card border border-border p-4 space-y-3.5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={
              isWebsite
                ? "inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-400"
                : "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary"
            }
          >
            <Plane className="w-3.5 h-3.5" />
            Aboki BDC Travels Booking Form
          </span>
          <h3
            className={
              isWebsite
                ? "text-xl sm:text-2xl font-['Playfair_Display',Georgia,serif] font-black text-white mt-1"
                : "text-sm font-bold text-card-foreground mt-0.5"
            }
          >
            Book Your Umrah, Flight or Visa Request
          </h3>
          <p
            className={
              isWebsite
                ? "text-xs text-slate-400 mt-1"
                : "text-[11px] text-muted-foreground mt-0.5"
            }
          >
            Fill out your trip details below — our travel desk receives your request immediately and responds with the best fare.
          </p>
        </div>
      </div>

      <div className={isWebsite ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {/* Full Name */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            Full Name (as on Passport) *
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Ibrahim Musa"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          />
        </div>

        {/* Phone / WhatsApp */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            Phone / WhatsApp Number *
          </label>
          <input
            type="tel"
            required
            maxLength={40}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          />
        </div>

        {/* Email */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            Email Address (Optional)
          </label>
          <input
            type="email"
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          />
        </div>

        {/* Service / Package Type */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            Travel Service / Package *
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            aria-label="Travel Service or Package"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Departure City */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              Departure City *
            </span>
          </label>
          <select
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
            aria-label="Departure City"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          >
            {DEPARTURE_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            Destination *
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g., Makkah & Madinah, Dubai, London"
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          />
        </div>

        {/* Travel Dates & Travelers */}
        <div className={isWebsite ? "contents" : "grid grid-cols-2 gap-2"}>
          <div>
            <label
              className={
                isWebsite
                  ? "block text-xs font-bold text-slate-300 mb-1.5"
                  : "block text-[11px] font-semibold text-card-foreground mb-1"
              }
            >
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-red-500" />
                Departure Date *
              </span>
            </label>
            <input
              type="date"
              required
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className={
                isWebsite
                  ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  : "w-full h-9 px-2.5 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              }
            />
          </div>

          <div>
            <label
              className={
                isWebsite
                  ? "block text-xs font-bold text-slate-300 mb-1.5"
                  : "block text-[11px] font-semibold text-card-foreground mb-1"
              }
            >
              Return Date (Optional)
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className={
                isWebsite
                  ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  : "w-full h-9 px-2.5 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              }
            />
          </div>
        </div>

        {/* Number of Travelers */}
        <div>
          <label
            className={
              isWebsite
                ? "block text-xs font-bold text-slate-300 mb-1.5"
                : "block text-[11px] font-semibold text-card-foreground mb-1"
            }
          >
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3 text-red-500" />
              Number of Travelers *
            </span>
          </label>
          <input
            type="number"
            min={1}
            max={50}
            required
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            className={
              isWebsite
                ? "w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                : "w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            }
          />
        </div>
      </div>

      {/* Special Requests / Notes */}
      <div>
        <label
          className={
            isWebsite
              ? "block text-xs font-bold text-slate-300 mb-1.5"
              : "block text-[11px] font-semibold text-card-foreground mb-1"
          }
        >
          Additional Details / Preferences (Optional)
        </label>
        <textarea
          rows={isWebsite ? 3 : 2}
          maxLength={600}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Preferred airline, cabin class, hotel proximity to Haram, visa needs, or FX currency requirement..."
          className={
            isWebsite
              ? "w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              : "w-full p-2.5 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          }
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={
          isWebsite
            ? "w-full sm:w-auto px-6 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
            : "w-full h-10 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
        }
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting Request...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Travel Booking Form
          </>
        )}
      </button>
    </form>
  );
}
