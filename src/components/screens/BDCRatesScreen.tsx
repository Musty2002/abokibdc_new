import { useState, useEffect, forwardRef, useCallback, useMemo } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Branch, CityData, branchesData, getBranchCoordinates } from "@/data/branchesData";
import CityCard from "@/components/rates/CityCard";
import BranchDetailSheet from "@/components/rates/BranchDetailSheet";
import RateAlertModal from "@/components/rates/RateAlertModal";
import SearchFilter from "@/components/rates/SearchFilter";
import { RateCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRateAlerts } from "@/hooks/useRateAlerts";
import { supabase } from "@/integrations/supabase/client";

interface BDCRatesScreenProps {
  onRefresh?: () => Promise<void>;
}

const BDCRatesScreen = forwardRef<HTMLDivElement, BDCRatesScreenProps>(
  ({ onRefresh }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<CityData[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [showBranchDetail, setShowBranchDetail] = useState(false);
    const [showRateAlert, setShowRateAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);

    const { alerts, removeAlert, refreshAlerts } = useRateAlerts();

    const fetchBranches = useCallback(async () => {
      try {
        const cityPriority: Record<string, number> = {
          ABUJA: 1,
          LAGOS: 2,
          "PORT HARCOURT": 3,
          KANO: 4,
          IBADAN: 5,
        };

        const { data: cities, error: citiesError } = await supabase
          .from("cities")
          .select("id, name")
          .eq("is_active", true);

        if (citiesError) throw citiesError;

        const { data: branches, error: branchesError } = await supabase
          .from("branches")
          .select(`
            id,
            name,
            address,
            city_id,
            whatsapp_number,
            operating_hours,
            rating,
            review_count,
            latitude,
            longitude
          `)
          .eq("is_active", true);

        if (branchesError) throw branchesError;

        const { data: rates, error: ratesError } = await supabase
          .from("branch_rates")
          .select(`
            branch_id,
            currency_id,
            denomination,
            buy_rate,
            sell_rate,
            currencies (code, name, flag_url)
          `);

        if (ratesError) throw ratesError;

        const sortedCities = [...(cities || [])].sort((a, b) => {
          const priorityA = cityPriority[a.name.toUpperCase()] || 999;
          const priorityB = cityPriority[b.name.toUpperCase()] || 999;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return a.name.localeCompare(b.name);
        });

        const cityData: CityData[] = sortedCities
          .map((city) => {
            const cityBranches = (branches || []).filter(
              (b) => b.city_id === city.id
            );

            return {
              city: city.name.toUpperCase(),
              branches: cityBranches.map((branch) => {
                const branchRates = (rates || []).filter(
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
                  whatsappNumber: branch.whatsapp_number || "",
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
          .filter((city) => city.branches.length > 0);

        const nextData = cityData.length > 0 ? cityData : branchesData;
        setData(nextData);

        // Keep selectedBranch coordinates in sync if sheet is open
        setSelectedBranch((prev) => {
          if (!prev) return null;
          for (const group of nextData) {
            const found = group.branches.find((b) => b.id === prev.id);
            if (found) return found;
          }
          return prev;
        });
      } catch (error) {
        console.error("Error fetching branches:", error);
        setData(branchesData);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchBranches();
      const handleDbUpdate = () => {
        fetchBranches();
        refreshAlerts();
      };
      window.addEventListener("aboki-db-updated", handleDbUpdate);
      return () => window.removeEventListener("aboki-db-updated", handleDbUpdate);
    }, [fetchBranches, refreshAlerts]);

    const handleBranchSelect = (branch: Branch) => {
      setSelectedBranch(branch);
      setShowBranchDetail(true);
    };

    const handleCurrencyToggle = (currency: string) => {
      setSelectedCurrencies((prev) =>
        prev.includes(currency)
          ? prev.filter((c) => c !== currency)
          : [...prev, currency]
      );
    };

    const handleClearFilters = () => {
      setSearchQuery("");
      setSelectedCurrencies([]);
    };

    const filteredData = useMemo(() => {
      return data
        .map((cityGroup) => {
          const cityMatches = cityGroup.city
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          const matchingBranches = cityGroup.branches.filter((branch) => {
            const branchMatchesSearch =
              !searchQuery ||
              cityMatches ||
              branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              branch.address.toLowerCase().includes(searchQuery.toLowerCase());

            const branchMatchesCurrency =
              selectedCurrencies.length === 0 ||
              selectedCurrencies.every((curr) =>
                branch.currencies.some((c) => c.code === curr)
              );

            return branchMatchesSearch && branchMatchesCurrency;
          });

          return {
            ...cityGroup,
            branches: matchingBranches,
          };
        })
        .filter((cityGroup) => cityGroup.branches.length > 0);
    }, [data, searchQuery, selectedCurrencies]);

    if (isLoading) {
      return (
        <div className="flex flex-col gap-4 p-4 pb-8">
          {[1, 2, 3, 4].map((i) => (
            <RateCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <>
        <div ref={ref} className="flex flex-col gap-4 p-4 pb-8">
          {/* Search & Currency Filter */}
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCurrencies={selectedCurrencies}
            onCurrencyToggle={handleCurrencyToggle}
            onClearFilters={handleClearFilters}
          />

          {/* Rate Alerts Banner & Action */}
          <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-card-foreground">
                    Rate Alerts ({alerts.length})
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Get notified when currencies hit your target rate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRateAlert(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Alert
              </button>
            </div>

            {alerts.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-border/60 space-y-1.5">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between text-xs bg-secondary/10 px-2.5 py-1.5 rounded-lg"
                  >
                    <span className="text-card-foreground font-medium">
                      {alert.currency} {alert.type === "above" ? "≥" : "≤"} ₦
                      {alert.targetRate.toLocaleString()}
                      {alert.branchName ? ` • ${alert.branchName}` : ""}
                    </span>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* City Cards */}
          {filteredData.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <p className="text-sm font-medium text-card-foreground">
                No matching branches found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try clearing your search or currency filters
              </p>
            </div>
          ) : (
            filteredData.map((cityData) => (
              <CityCard
                key={cityData.city}
                cityData={cityData}
                onBranchSelect={handleBranchSelect}
              />
            ))
          )}
        </div>

        {/* Branch Detail Sheet */}
        <BranchDetailSheet
          branch={selectedBranch}
          open={showBranchDetail}
          onOpenChange={setShowBranchDetail}
        />

        {/* Global Rate Alert Modal */}
        <RateAlertModal
          open={showRateAlert}
          onOpenChange={(open) => {
            setShowRateAlert(open);
            if (!open) refreshAlerts();
          }}
        />
      </>
    );
  }
);

BDCRatesScreen.displayName = "BDCRatesScreen";

export default BDCRatesScreen;
