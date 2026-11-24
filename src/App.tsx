import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import AbokiWebsite from "./pages/website/AbokiWebsite";
import PrivacyPolicyPage from "./pages/website/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/website/TermsOfServicePage";
import ContactUsPage from "./pages/website/ContactUsPage";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBranches from "./pages/admin/AdminBranches";
import AdminBranchForm from "./pages/admin/AdminBranchForm";
import AdminCities from "./pages/admin/AdminCities";
import AdminCurrencies from "./pages/admin/AdminCurrencies";
import AdminRates from "./pages/admin/AdminRates";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminBranchAdmins from "./pages/admin/AdminBranchAdmins";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminMyBranch from "./pages/admin/AdminMyBranch";
import AdminTravelInquiries from "./pages/admin/AdminTravelInquiries";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuotaExceeded);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuotaExceeded);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{" "}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{" "}
              for instructions to update your account.
            </span>
          </div>
        )}
        <BrowserRouter>
          <Routes>
            {(() => {
              const host = window.location.host.toLowerCase();
              const isSetup = host === "setup.abokibdc.com.ng";
              const isAdmin = host === "admin.abokibdc.com.ng";
              const isMobileAppSubdomain =
                host === "app.abokibdc.com.ng" || Capacitor.isNativePlatform();

              const redirectForSubdomain = () => {
                const path = window.location.pathname;

                if (isSetup) return "/admin/setup";

                if (isAdmin) {
                  if (path === "/") return "/admin";
                  if (path.startsWith("/admin")) return path;
                  return `/admin${path}`;
                }

                return null;
              };

              const SubdomainGuard = ({ children }: { children: React.ReactNode }) => {
                const redirectTo = redirectForSubdomain();
                if (redirectTo) return <Navigate to={redirectTo} replace />;
                return <>{children}</>;
              };

              return (
                <>
                  {/* Official Aboki BDC Website (or Mobile App on app.abokibdc.com.ng) */}
                  <Route
                    path="/"
                    element={
                      <SubdomainGuard>
                        {isMobileAppSubdomain ? <Index /> : <AbokiWebsite />}
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/website"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/market-rates"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/branch"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/news"
                    element={
                      <SubdomainGuard>
                        <AbokiWebsite />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/contact-us"
                    element={
                      <SubdomainGuard>
                        <ContactUsPage />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <SubdomainGuard>
                        <ContactUsPage />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/privacy-policy"
                    element={
                      <SubdomainGuard>
                        <PrivacyPolicyPage />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/privacy"
                    element={
                      <SubdomainGuard>
                        <PrivacyPolicyPage />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/terms-of-service"
                    element={
                      <SubdomainGuard>
                        <TermsOfServicePage />
                      </SubdomainGuard>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <SubdomainGuard>
                        <TermsOfServicePage />
                      </SubdomainGuard>
                    }
                  />

                  {/* Dedicated Aboki BDC Mobile App View (sharing the same live Firebase DB) */}
                  <Route
                    path="/app"
                    element={
                      <SubdomainGuard>
                        <Index />
                      </SubdomainGuard>
                    }
                  />

                  {/* Single Shared Admin Portal */}
                  <Route path="/admin/setup" element={<AdminSetup />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="branches" element={<AdminBranches />} />
                    <Route path="branches/new" element={<AdminBranchForm />} />
                    <Route path="branches/:id/edit" element={<AdminBranchForm />} />
                    <Route path="cities" element={<AdminCities />} />
                    <Route path="currencies" element={<AdminCurrencies />} />
                    <Route path="rates" element={<AdminRates />} />
                    <Route path="travel-inquiries" element={<AdminTravelInquiries />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="branch-admins" element={<AdminBranchAdmins />} />
                    <Route path="my-branch" element={<AdminMyBranch />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Catch-all: on subdomains, always force into admin paths */}
                  <Route
                    path="*"
                    element={(() => {
                      const redirectTo = redirectForSubdomain();
                      if (redirectTo) return <Navigate to={redirectTo} replace />;
                      return <NotFound />;
                    })()}
                  />
                </>
              );
            })()}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
