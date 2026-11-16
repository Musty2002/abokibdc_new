import { cn } from "@/lib/utils";

export type TabType =
  | "bdc-rates"
  | "cbn-rates"
  | "converter"
  | "travels"
  | "news"
  | "about";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: "bdc-rates", label: "BDC Rates" },
  { id: "cbn-rates", label: "CBN Rates" },
  { id: "converter", label: "Converter" },
  { id: "travels", label: "Travels" },
  { id: "news", label: "News" },
  { id: "about", label: "About us" },
];

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <nav className="bg-primary border-b border-black/10 shadow-xs">
      <div className="flex items-center gap-1 overflow-x-auto px-2.5 py-1.5 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all relative select-none",
                isActive
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;
