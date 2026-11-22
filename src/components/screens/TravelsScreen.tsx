import { useState } from "react";
import {
  Plane,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Building2,
  Compass,
  FileCheck2,
  Car,
  Briefcase,
  Palmtree,
  Star,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Clock,
  Moon,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UmrahPackage {
  id: string;
  title: string;
  tier: string;
  duration: string;
  departureWindow: string;
  price: number;
  image: string;
  inclusions: string[];
}

interface FlightDeal {
  id: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  tripType: string;
  cabin: string;
  dates: string;
  price: number;
  tag: string;
  image: string;
}

interface TourPackage {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  highlights: string[];
  badge: string;
  image: string;
}

const UMRAH_PACKAGES: UmrahPackage[] = [
  {
    id: "umrah-vip",
    title: "Executive Haramain Umrah Package",
    tier: "5-Star VIP • Makkah & Madinah",
    duration: "10 Days / 9 Nights",
    departureWindow: "Monthly Departures & Ramadan",
    price: 3450000,
    image:
      "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=1000&q=80",
    inclusions: [
      "Saudi Umrah E-Visa & Medical Insurance",
      "Return Flights (Abuja / Lagos / Kano ⇄ Jeddah/Madinah)",
      "5-Star Clock Tower / Haram View Hotel in Makkah",
      "5-Star Central Haram Hotel in Madinah",
      "Haramain High-Speed Train (Madinah ⇄ Makkah)",
      "Guided Ziyarah, Rawdah Permit & 5L Zamzam",
    ],
  },
  {
    id: "umrah-standard",
    title: "Economy Plus Umrah Package",
    tier: "4-Star Comfort • Group & Family",
    duration: "14 Days / 13 Nights",
    departureWindow: "All-Year Round Departures",
    price: 2350000,
    image:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=80",
    inclusions: [
      "Fast-Track Saudi Umrah Visa Processing",
      "Return Economy Flight Ticket Included",
      "Walking-Distance Hotels in Makkah & Madinah",
      "Full Ground VIP Air-Conditioned Bus Transfers",
      "Experienced Scholars & Mutawif Guidance",
      "Daily Buffet Breakfast & Suhoor/Iftar Options",
    ],
  },
];

const FLIGHT_DEALS: FlightDeal[] = [
  {
    id: "abv-los",
    origin: "Abuja",
    originCode: "ABV",
    destination: "Lagos",
    destinationCode: "LOS",
    tripType: "Round Trip",
    cabin: "Economy",
    dates: "May 29 - June 1, 2026",
    price: 155900,
    tag: "Domestic Best Seller",
    image:
      "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "abv-enu",
    origin: "Abuja",
    originCode: "ABV",
    destination: "Enugu",
    destinationCode: "ENU",
    tripType: "Round Trip",
    cabin: "Economy",
    dates: "June 2 - June 6, 2026",
    price: 238502,
    tag: "Popular Route",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "abv-cai",
    origin: "Abuja",
    originCode: "ABV",
    destination: "Cairo",
    destinationCode: "CAI",
    tripType: "Round Trip",
    cabin: "Economy",
    dates: "June 9 - June 14, 2026",
    price: 904305,
    tag: "North Africa Special",
    image:
      "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "abv-lhr",
    origin: "Abuja",
    originCode: "ABV",
    destination: "London",
    destinationCode: "LHR",
    tripType: "Round Trip",
    cabin: "Economy",
    dates: "June 3 - June 7, 2026",
    price: 1249422,
    tag: "UK Direct Deal",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "abv-dxb",
    origin: "Abuja",
    originCode: "ABV",
    destination: "Dubai",
    destinationCode: "DXB",
    tripType: "Round Trip",
    cabin: "Economy",
    dates: "June 5 - June 8, 2026",
    price: 1277717,
    tag: "UAE Hot Fare",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
  },
];

const TOUR_PACKAGES: TourPackage[] = [
  {
    id: "magical-dubai",
    title: "Magical Dubai",
    subtitle: "Escape to Stunning Dubai",
    duration: "5 Days / 4 Nights",
    highlights: [
      "Burj Khalifa & Dubai Mall Tour",
      "Desert Safari with BBQ Dinner",
      "Luxury Marina Dhow Cruise",
      "UAE Visa & Return Airport Transfers",
    ],
    badge: "Most Popular",
    image:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "egypt-experience",
    title: "Egypt Experience",
    subtitle: "Journey Through Ancient Egypt",
    duration: "6 Days / 5 Nights",
    highlights: [
      "Great Pyramids of Giza & Sphinx",
      "Egyptian Museum & Khan el-Khalili",
      "Nile River Dinner Cruise",
      "4/5-Star Hotel & Guided Excursions",
    ],
    badge: "Cultural Heritage",
    image:
      "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "zanzibar-getaway",
    title: "Zanzibar Getaway",
    subtitle: "Relax in Tropical Zanzibar",
    duration: "5 Days / 4 Nights",
    highlights: [
      "Nungwi White Sand Beach Resort",
      "Historic Stone Town Guided Walk",
      "Safari Blue & Spice Island Tour",
      "Breakfast, Dinner & Island Transfers",
    ],
    badge: "Island Paradise",
    image:
      "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
  },
];

const TRAVEL_SERVICES = [
  {
    icon: Moon,
    title: "Umrah & Hajj Packages",
    desc: "Complete Makkah & Madinah pilgrimage packages, visas, and Haramain hotels.",
  },
  {
    icon: Plane,
    title: "Flight Bookings",
    desc: "Domestic & international flight reservations at the best market fares.",
  },
  {
    icon: Building2,
    title: "Hotel Reservations",
    desc: "Handpicked luxury and budget-friendly hotel stays around the globe.",
  },
  {
    icon: Palmtree,
    title: "Tour Packages",
    desc: "All-inclusive vacation packages to Dubai, Egypt, Zanzibar & Europe.",
  },
  {
    icon: FileCheck2,
    title: "Visa Assistance",
    desc: "Expert documentation and application guidance for seamless visa approval.",
  },
  {
    icon: Compass,
    title: "Travel Planning",
    desc: "Custom-built travel itineraries tailored to your schedule and budget.",
  },
  {
    icon: Car,
    title: "Airport Transfers",
    desc: "Punctual, comfortable airport pickup and chauffeur services worldwide.",
  },
  {
    icon: Briefcase,
    title: "Corporate & Group Travel",
    desc: "Dedicated executive flights, retreats, and group travel coordination.",
  },
];

const TESTIMONIALS = [
  {
    name: "Alhaji Musa K.",
    rating: "4.9 / 5.0",
    quote:
      "Our Umrah trip with Aboki BDC Travels was deeply spiritual and well-organized. The Makkah hotel was right by the Haram and our visa came out in 48 hours.",
  },
  {
    name: "Tunde A.",
    rating: "4.7 / 5.0",
    quote:
      "Booking my flight with Aboki BDC Travels was effortless! Their team got me a great deal and handled everything smoothly.",
  },
  {
    name: "Chioma E.",
    rating: "4.6 / 5.0",
    quote:
      "Their visa assistance and holiday package made our Dubai family vacation completely stress-free.",
  },
  {
    name: "Ahmed S.",
    rating: "4.8 / 5.0",
    quote:
      "Fast response on WhatsApp, transparent pricing, and easy currency exchange right alongside our ticket booking.",
  },
];

const ABOKI_TRAVELS_WHATSAPP = "2347064937199";
const ABOKI_TRAVELS_PHONE = "+2347064937199";
const ABOKI_TRAVELS_EMAIL = "abokibdcs@gmail.com";

export default function TravelsScreen() {
  const [tripType, setTripType] = useState<"Round Trip" | "One Way">("Round Trip");
  const [cabinClass, setCabinClass] = useState("Economy");
  const [fromCity, setFromCity] = useState("Abuja (ABV)");
  const [toCity, setToCity] = useState("Jeddah (JED)");
  const [departDate, setDepartDate] = useState("2026-05-29");
  const [returnDate, setReturnDate] = useState("2026-06-08");
  const [passengers, setPassengers] = useState("1 Adult");

  // Booking drawer state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingSubtitle, setBookingSubtitle] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const openQuickBooking = (subject: string, subtitle: string, type = "General Inquiry") => {
    setBookingSubject(subject);
    setBookingSubtitle(subtitle);
    setBookingType(type);
    setSubmitted(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerNotes("");
    setBookingOpen(true);
  };

  const handleFlightSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = `${fromCity} → ${toCity} (${tripType}, ${cabinClass})`;
    const datesInfo =
      tripType === "Round Trip"
        ? `Depart: ${departDate} • Return: ${returnDate} • ${passengers}`
        : `Depart: ${departDate} • ${passengers}`;
    openQuickBooking(`Flight Booking: ${summary}`, datesInfo, "Flight Booking");
  };

  const handleSubmitToAdmin = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: "Required fields missing", description: "Please enter your name and phone number.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("travel_inquiries").insert({
        inquiry_type: bookingType,
        subject: bookingSubject,
        details: bookingSubtitle || null,
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null,
        notes: customerNotes.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "✅ Inquiry Submitted!", description: "Our travel team will reach out to you shortly." });
    } catch (err) {
      console.error(err);
      toast({ title: "Submission failed", description: "Please try again or contact us on WhatsApp.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWhatsAppBooking = () => {
    const messageLines = [
      `Hello Aboki BDC Travels! ✈️`,
      `I would like to book / inquire about:`,
      `*${bookingSubject}*`,
      bookingSubtitle ? `Details: ${bookingSubtitle}` : "",
      customerName ? `Name: ${customerName}` : "",
      customerPhone ? `Phone: ${customerPhone}` : "",
      customerEmail ? `Email: ${customerEmail}` : "",
      customerNotes ? `Notes: ${customerNotes}` : "",
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${ABOKI_TRAVELS_WHATSAPP}?text=${encodeURIComponent(
      messageLines.join("\n")
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setBookingOpen(false);
    toast({
      title: "Redirecting to Aboki BDC Travels",
      description: "Our travel desk will confirm your reservation on WhatsApp.",
    });
  };

  return (
    <div className="flex flex-col gap-5 p-4 pb-10">
      {/* Hero Banner - Aboki BDC Travels */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white shadow-md border border-slate-800">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
          alt="Aboki BDC Travels"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-red-950/40" />

        <div className="relative p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
              <Plane className="w-3 h-3" />
              Aboki BDC Travels
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs">
              <Moon className="w-3 h-3" />
              IATA & Umrah Accredited
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold">
              Where Every Journey Begins Right
            </p>
            <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-black leading-tight text-white">
              Aboki BDC Travels & Tours
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed">
              Sacred Umrah & Hajj packages, global flight ticketing at the best fares, luxury hotel reservations, and stress-free visa processing.
            </p>
          </div>

          {/* Flight Search / Quote Widget */}
          <form
            onSubmit={handleFlightSearchSubmit}
            className="bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-3.5 space-y-3 shadow-lg border border-white/40 mt-2"
          >
            {/* Trip Type & Cabin Selector */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {(["Round Trip", "One Way"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripType(type)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      tripType === type
                        ? "bg-primary text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                aria-label="Cabin Class"
                className="text-[11px] font-semibold bg-slate-100 text-slate-800 rounded-lg px-2 py-1 border-none focus:ring-1 focus:ring-primary"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business Class">Business Class</option>
                <option value="First Class">First Class</option>
              </select>
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                  From
                </Label>
                <div className="relative mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="h-8 pl-8 text-xs font-medium bg-slate-50 border-slate-200"
                    placeholder="Abuja (ABV)"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                  To
                </Label>
                <div className="relative mt-0.5">
                  <Plane className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="h-8 pl-8 text-xs font-medium bg-slate-50 border-slate-200"
                    placeholder="Destination city"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Passengers */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                  Departure
                </Label>
                <div className="relative mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="h-8 pl-8 text-[11px] bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              {tripType === "Round Trip" ? (
                <div>
                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Return
                  </Label>
                  <div className="relative mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="h-8 pl-8 text-[11px] bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                    Passengers
                  </Label>
                  <div className="relative mt-0.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                      className="h-8 pl-8 text-xs bg-slate-50 border-slate-200"
                      placeholder="1 Adult"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              <Plane className="w-3.5 h-3.5 mr-1.5" />
              Search & Book with Aboki BDC Travels
            </Button>
          </form>
        </div>
      </div>

      {/* TOP FEATURED SECTION: Sacred Umrah Packages */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Moon className="w-3 h-3" />
              Sacred Pilgrimage • Top Priority
            </span>
            <h3 className="text-base font-extrabold text-foreground">
              Featured Umrah Packages (Makkah & Madinah)
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {UMRAH_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-card rounded-2xl border-2 border-amber-500/40 overflow-hidden shadow-md"
            >
              <div className="relative h-44 w-full bg-slate-950">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

                <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
                  {pkg.tier}
                </span>

                <span className="absolute top-2.5 right-2.5 bg-slate-950/85 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/30">
                  <Clock className="w-2.5 h-2.5" />
                  {pkg.duration}
                </span>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                    {pkg.departureWindow}
                  </p>
                  <h4 className="text-base font-bold leading-snug">{pkg.title}</h4>
                </div>
              </div>

              <div className="p-3.5 space-y-3">
                <div className="grid grid-cols-1 gap-1.5">
                  {pkg.inclusions.map((inc) => (
                    <div
                      key={inc}
                      className="flex items-start gap-1.5 text-[11px] text-card-foreground/90"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border/70">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-semibold">
                      All-Inclusive Package From
                    </span>
                    <span className="text-base font-black text-primary">
                      ₦{pkg.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      / person
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openQuickBooking(
                        `Umrah Package: ${pkg.title}`,
                        `${pkg.tier} • ${pkg.duration} • Starting from ₦${pkg.price.toLocaleString()}`,
                        "Umrah Package"
                      )
                    }
                    className="h-8 px-3.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg shadow-xs"
                  >
                    Book Umrah
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Best Flight Deals for Your Next Trip */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Featured Flight Offers
            </p>
            <h3 className="text-sm font-bold text-foreground">
              Best Flight Deals for Your Next Trip
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            Round Trip • Economy
          </span>
        </div>

        <div className="space-y-2.5">
          {FLIGHT_DEALS.map((deal) => (
            <div
              key={deal.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-stretch">
                <div className="w-28 sm:w-32 relative shrink-0 bg-slate-200">
                  <img
                    src={deal.image}
                    alt={`${deal.origin} to ${deal.destination}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                    {deal.tag}
                  </span>
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-card-foreground">
                          {deal.origin}
                        </span>
                        <span className="text-[10px] text-primary font-bold">⇄</span>
                        <span className="text-xs font-bold text-card-foreground">
                          {deal.destination}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {deal.originCode}-{deal.destinationCode}
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {deal.tripType} • {deal.cabin}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-primary" />
                      {deal.dates}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60">
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">
                        Starting from
                      </span>
                      <span className="text-sm font-extrabold text-primary">
                        ₦{deal.price.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        openQuickBooking(
                          `Flight Deal: ${deal.origin} ⇄ ${deal.destination}`,
                          `${deal.tripType} (${deal.cabin}) • ${deal.dates} • ₦${deal.price.toLocaleString()}`,
                          "Flight Deal"
                        )
                      }
                      className="h-7 px-3 text-[11px] font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Tours & Vacations */}
      <section className="space-y-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Tours & Vacations
          </p>
          <h3 className="text-sm font-bold text-foreground">
            Turn Your Travel Dreams Into Reality
          </h3>
        </div>

        <div className="space-y-3">
          {TOUR_PACKAGES.map((tour) => (
            <div
              key={tour.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-xs"
            >
              <div className="relative h-40 w-full bg-slate-900">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {tour.badge}
                </span>
                <span className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  {tour.duration}
                </span>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                    {tour.title}
                  </p>
                  <h4 className="text-base font-bold leading-snug">{tour.subtitle}</h4>
                </div>
              </div>

              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-1 gap-1">
                  {tour.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-[11px] font-medium text-slate-600">
                    All-inclusive visa, hotel & tours
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openQuickBooking(
                        `Tour Package: ${tour.title} (${tour.subtitle})`,
                        `${tour.duration} • Includes: ${tour.highlights.join(", ")}`,
                        "Tour Package"
                      )
                    }
                    className="h-7 px-3 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    Explore Package
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Our Services - What We Do */}
      <section className="space-y-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Our Services
          </p>
          <h3 className="text-sm font-bold text-foreground">
            What We Do at Aboki BDC Travels
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {TRAVEL_SERVICES.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() =>
                openQuickBooking(
                  `Service Inquiry: ${service.title}`,
                  service.desc,
                  "Service Inquiry"
                )
              }
              className="text-left bg-card p-3 rounded-xl border border-border hover:border-primary/40 transition-all space-y-1.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <service.icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-card-foreground">
                {service.title}
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {service.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Section 5: Why Choose Aboki BDC Travels */}
      <section className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Why Travel With Aboki BDC Travels
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">Best Fare Guarantee & Instant FX Exchange</p>
              <p className="text-[11px] text-slate-300">
                Enjoy seamless Naira, USD, SAR, AED, GBP, and EUR settlement for your Umrah, flights, and international hotels.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">24/7 Dedicated Travel & Pilgrimage Desk</p>
              <p className="text-[11px] text-slate-300">
                From Saudi Umrah visas and Haramain hotel bookings to UAE, UK, Schengen, and Egypt travel support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials */}
      <section className="space-y-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Testimonials
          </p>
          <h3 className="text-sm font-bold text-foreground">
            Hear What Our Happy Travelers Are Saying
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.name}
              className="bg-card rounded-xl p-3 border border-border space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-card-foreground">
                  {item.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {item.rating}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                "{item.quote}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7: Direct Contact & Abuja Office */}
      <section className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">
              Aboki BDC Travels — Head Office
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Wuse Zone 4, Abuja, FCT & Nationwide Aboki BDC Branches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://wa.me/${ABOKI_TRAVELS_WHATSAPP}?text=${encodeURIComponent(
              "Hello Aboki BDC Travels! I want to inquire about Umrah packages, flights, and travel deals."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp Desk
          </a>

          <a
            href={`tel:${ABOKI_TRAVELS_PHONE}`}
            className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Travel Desk
          </a>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <a
            href={`mailto:${ABOKI_TRAVELS_EMAIL}`}
            className="inline-flex items-center gap-1 hover:text-primary"
          >
            <Mail className="w-3 h-3 text-primary" />
            {ABOKI_TRAVELS_EMAIL}
          </a>
          <span className="text-[10px] font-semibold text-primary">
            Aboki Bureau De Change Group
          </span>
        </div>
      </section>

      {/* Interactive Booking / Inquiry Drawer */}
      <Drawer open={bookingOpen} onOpenChange={setBookingOpen}>
        <DrawerContent className="bg-white rounded-t-2xl max-h-[90vh]">
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Aboki BDC Travels — Booking Request
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {bookingSubject}
              </h3>
              {bookingSubtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{bookingSubtitle}</p>
              )}
            </div>

            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <h4 className="text-base font-bold text-slate-900">Inquiry Submitted!</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  Your travel request has been sent to our admin team. We'll reach out to you shortly on WhatsApp or phone.
                </p>
                <Button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="mt-2 h-9 px-6 text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name as on passport"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      type="tel"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Email Address <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="yourname@email.com"
                      type="email"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Additional Preferences <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Preferred dates, hotel tier, special requirements..."
                      className="mt-1 text-xs min-h-[72px] resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  {/* Primary: Submit to Admin (saves to DB) */}
                  <Button
                    type="button"
                    onClick={handleSubmitToAdmin}
                    disabled={isSubmitting}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1.5" />
                        Submit Booking Request
                      </>
                    )}
                  </Button>

                  {/* Secondary: also open WhatsApp */}
                  <Button
                    type="button"
                    onClick={handleConfirmWhatsAppBooking}
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold text-green-700 border-green-300 hover:bg-green-50"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    Continue on WhatsApp Instead
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBookingOpen(false)}
                    className="w-full h-8 text-xs text-slate-500"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
