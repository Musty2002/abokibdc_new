import { useState, useMemo, useEffect, forwardRef, useCallback } from "react";
import { Share2, MapPin, RefreshCw } from "lucide-react";
import { ConverterSkeleton } from "@/components/ui/LoadingSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { branchesData } from "@/data/branchesData";
import { toast } from "@/hooks/use-toast";

const getFlagCode = (currencyCode: string): string => {
  const map: Record<string, string> = {
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
    NGN: "ng",
  };
  return map[currencyCode] || "un";
};

const defaultCurrencies = [
  { code: "USD", name: "US Dollar", buyRate: 1580, sellRate: 1620 },
  { code: "EUR", name: "Euro", buyRate: 1680, sellRate: 1720 },
  { code: "GBP", name: "British Pound", buyRate: 1950, sellRate: 2000 },
  { code: "CAD", name: "Canadian Dollar", buyRate: 1150, sellRate: 1180 },
  { code: "AED", name: "UAE Dirham", buyRate: 425, sellRate: 440 },
  { code: "ZAR", name: "South African Rand", buyRate: 85, sellRate: 92 },
  { code: "CNY", name: "Chinese Yuan", buyRate: 215, sellRate: 225 },
  { code: "CHF", name: "Swiss Franc", buyRate: 1780, sellRate: 1830 },
];

interface ConverterBranch {
  id: string;
  name: string;
  city: string;
  rates: Record<string, { buyRate: number; sellRate: number }>;
}

interface ConverterScreenProps {
  onRefresh?: () => Promise<void>;
}

const ConverterScreen = forwardRef<HTMLDivElement, ConverterScreenProps>(
  ({ onRefresh }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [branchList, setBranchList] = useState<ConverterBranch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [isBuying, setIsBuying] = useState(true);
    const [amount, setAmount] = useState("100");

    const loadBranchRates = useCallback(async () => {
      try {
        const [branchesRes, ratesRes, citiesRes] = await Promise.all([
          supabase.from("branches").select("id, name, city_id").eq("is_active", true),
          supabase.from("branch_rates").select("branch_id, buy_rate, sell_rate, denomination, currencies(code)"),
          supabase.from("cities").select("id, name"),
        ]);

        const cityMap: Record<string, string> = {};
        (citiesRes.data || []).forEach((c: any) => {
          cityMap[c.id] = c.name;
        });

        const mapped: ConverterBranch[] = (branchesRes.data || []).map((b: any) => {
          const bRates = (ratesRes.data || []).filter((r: any) => r.branch_id === b.id);
          const rateMap: Record<string, { buyRate: number; sellRate: number }> = {};

          bRates.forEach((r: any) => {
            const code = r.currencies?.code;
            if (!code) return;
            if (!rateMap[code] || r.denomination === "$100+") {
              rateMap[code] = {
                buyRate: r.buy_rate,
                sellRate: r.sell_rate,
              };
            }
          });

          return {
            id: b.id,
            name: `${cityMap[b.city_id] || ""} - ${b.name}`,
            city: cityMap[b.city_id] || "",
            rates: rateMap,
          };
        });

        if (mapped.length > 0) {
          setBranchList(mapped);
          setSelectedBranchId((prev) => prev || mapped[0].id);
        } else {
          throw new Error("Fallback to static branches");
        }
      } catch {
        const fallback: ConverterBranch[] = [];
        branchesData.forEach((c) => {
          c.branches.forEach((b) => {
            const rateMap: Record<string, { buyRate: number; sellRate: number }> = {};
            b.currencies.forEach((curr) => {
              if (!rateMap[curr.code] || curr.denomination === "$100+") {
                rateMap[curr.code] = { buyRate: curr.buyRate, sellRate: curr.sellRate };
              }
            });
            fallback.push({
              id: b.id,
              name: `${c.city} - ${b.name}`,
              city: c.city,
              rates: rateMap,
            });
          });
        });
        setBranchList(fallback);
        setSelectedBranchId((prev) => prev || fallback[0]?.id || "");
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      loadBranchRates();
      window.addEventListener("aboki-db-updated", loadBranchRates);
      return () => window.removeEventListener("aboki-db-updated", loadBranchRates);
    }, [loadBranchRates]);

    const currentBranch = useMemo(
      () => branchList.find((b) => b.id === selectedBranchId) || branchList[0],
      [branchList, selectedBranchId]
    );

    const currency = useMemo(() => {
      const base = defaultCurrencies.find((c) => c.code === selectedCurrency) || defaultCurrencies[0];
      const branchRate = currentBranch?.rates?.[selectedCurrency];
      return {
        ...base,
        buyRate: branchRate?.buyRate ?? base.buyRate,
        sellRate: branchRate?.sellRate ?? base.sellRate,
      };
    }, [selectedCurrency, currentBranch]);

    const rate = isBuying ? currency.buyRate : currency.sellRate;

    const result = useMemo(() => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return 0;
      return isBuying ? numAmount * rate : numAmount / rate;
    }, [amount, rate, isBuying]);

    const handleShare = async () => {
      const branchLabel = currentBranch?.name || "Aboki BDC";
      const text = isBuying
        ? `Converting ${amount} ${selectedCurrency} = ₦${result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} at ${branchLabel}`
        : `Converting ₦${amount} = ${result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedCurrency} at ${branchLabel}`;

      try {
        if (navigator.share) {
          await navigator.share({ text });
          return;
        }
      } catch {
        // Fallback to clipboard
      }

      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: text,
      });
    };

    const toggleDirection = () => {
      setIsBuying(!isBuying);
    };

    if (isLoading) {
      return <ConverterSkeleton />;
    }

    return (
      <div ref={ref} className="p-3 pb-6">
        {/* Header with Branch */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-3 shadow-lg mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 bg-primary-foreground/20 rounded-full flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-primary-foreground/70">Branch Office</p>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-primary-foreground text-xs font-semibold outline-none cursor-pointer w-full truncate"
                >
                  {branchList.map((branch) => (
                    <option key={branch.id} value={branch.id} className="text-card-foreground">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-primary-foreground/70">Active Rate</p>
              <p className="text-xs font-bold text-primary-foreground">
                ₦{rate.toLocaleString()}/{selectedCurrency}
              </p>
            </div>
          </div>
        </div>

        {/* Main Converter Card */}
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-3">
          {/* From Section */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {isBuying ? "You have" : "You want to sell"}
              </span>
              <div className="flex bg-secondary/50 rounded-full p-0.5">
                <button
                  onClick={() => setIsBuying(true)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-full ios-transition ${
                    isBuying ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setIsBuying(false)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-full ios-transition ${
                    !isBuying ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-secondary/20 rounded-xl p-2">
              <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-sm">
                <img
                  src={`https://flagcdn.com/24x18/${isBuying ? getFlagCode(selectedCurrency) : "ng"}.png`}
                  alt={isBuying ? selectedCurrency : "NGN"}
                  className="w-5 h-4 object-cover rounded-sm"
                />
                <span className="text-sm font-bold text-card-foreground">
                  {isBuying ? selectedCurrency : "NGN"}
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-bold text-card-foreground outline-none text-right min-w-0"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="relative h-0">
            <button
              onClick={toggleDirection}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg z-10 ios-transition active:scale-95"
              aria-label="Swap conversion direction"
            >
              <RefreshCw className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>

          {/* To Section */}
          <div className="p-4 bg-secondary/10">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
              {isBuying ? "You will receive (NGN)" : `You will receive (${selectedCurrency})`}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-2.5 py-2">
                <img
                  src={`https://flagcdn.com/24x18/${isBuying ? "ng" : getFlagCode(selectedCurrency)}.png`}
                  alt={isBuying ? "NGN" : selectedCurrency}
                  className="w-5 h-4 object-cover rounded-sm"
                />
                <span className="text-xs font-semibold text-card-foreground">
                  {isBuying ? "NGN" : selectedCurrency}
                </span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-xl font-bold text-card-foreground">
                  {result > 0
                    ? result.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Grid */}
        <div className="bg-card rounded-xl p-3 shadow-lg mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Select Currency
            </span>
            <span className="text-[10px] text-primary font-medium">
              {currency.name}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {defaultCurrencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => setSelectedCurrency(curr.code)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl ios-transition ${
                  selectedCurrency === curr.code
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/20 text-card-foreground hover:bg-secondary/40"
                }`}
              >
                <img
                  src={`https://flagcdn.com/32x24/${getFlagCode(curr.code)}.png`}
                  alt={curr.code}
                  className="w-6 h-4.5 object-cover rounded-sm mb-1"
                />
                <span className="text-[10px] font-semibold">{curr.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleShare}
            disabled={result <= 0}
            className="flex-1 flex items-center justify-center gap-2 bg-card rounded-xl py-3 shadow-lg ios-transition active:scale-[0.98] disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-card-foreground">Share / Copy Result</span>
          </button>
        </div>

        {/* Rate Info */}
        <div className="bg-secondary/20 rounded-xl p-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {isBuying ? "Buying" : "Selling"} Rate ({currentBranch?.name})
            </span>
            <span className="text-card-foreground font-semibold">
              1 {selectedCurrency} = ₦{rate.toLocaleString()}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-2 leading-relaxed">
            Rates are for reference only and may vary. Contact branch for current rates.
          </p>
        </div>
      </div>
    );
  }
);

ConverterScreen.displayName = "ConverterScreen";

export default ConverterScreen;
