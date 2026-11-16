import { Bell, Menu } from "lucide-react";
import abokiLogo from "@/assets/aboki-logo.jpg";

interface MobileHeaderProps {
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  unreadCount?: number;
}

const MobileHeader = ({
  onMenuClick,
  onNotificationClick,
  unreadCount = 0,
}: MobileHeaderProps) => {
  return (
    <header className="bg-primary safe-top sticky top-0 z-50 border-b border-white/10">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        {/* Logo & Brand Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={abokiLogo}
            alt="Aboki BDC"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1
              className="font-['Playfair_Display',Georgia,serif] font-black text-[16px] sm:text-[18px] text-white tracking-[0.01em] leading-tight truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
            >
              Aboki Bureau De Change
            </h1>
            <p className="text-[10px] font-medium text-white/80 tracking-wide uppercase leading-none mt-0.5 truncate">
              Trusted FX & Global Travels
            </p>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onNotificationClick}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors relative shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onMenuClick}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
