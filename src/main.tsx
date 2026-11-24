import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global Google Maps Platform error & auth listeners
(window as any).gm_authFailure = () => {
  window.dispatchEvent(
    new CustomEvent("gmp-auth-failure", {
      detail: { reason: "auth_failure" },
    })
  );
  window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(" ");
  if (msg.includes("OverQuotaMapError") || msg.includes("QuotaExceededError")) {
    window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
  }
  if (
    msg.includes("RefererNotAllowedMapError") ||
    msg.includes("InvalidKeyMapError") ||
    msg.includes("ApiNotActivatedMapError") ||
    msg.includes("BillingNotEnabledMapError")
  ) {
    window.dispatchEvent(
      new CustomEvent("gmp-auth-failure", {
        detail: { reason: msg },
      })
    );
  }
};

createRoot(document.getElementById("root")!).render(<App />);
