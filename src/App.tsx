import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load pages for better mobile performance
const Login = lazy(() => import("./pages/Login"));
const SetupInicial = lazy(() => import("./pages/SetupInicial"));
// Páginas de desenvolvimento: só entram no bundle em modo DEV
const DevGenerateIcons = import.meta.env.DEV ? lazy(() => import("./pages/DevGenerateIcons")) : null;
const DevGenerateScreenshots = import.meta.env.DEV ? lazy(() => import("./pages/DevGenerateScreenshots")) : null;
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const LocationSharingSettings = lazy(() => import("./pages/LocationSharingSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AngelDashboard = lazy(() => import("./pages/AngelDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PatientHome = lazy(() => import("./pages/PatientHome"));
const PatientSuggestions = lazy(() => import("./pages/PatientSuggestions"));

import { SmartRouter } from "@/components/SmartRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FontSizeProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/setup-inicial" element={<SetupInicial />} />
              {import.meta.env.DEV && DevGenerateIcons && DevGenerateScreenshots && (
                <>
                  <Route path="/dev/generate-icons" element={<DevGenerateIcons />} />
                  <Route path="/dev/generate-screenshots" element={<DevGenerateScreenshots />} />
                </>
              )}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              
              {/* Smart routing - detects if user is angel or patient */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <SmartRouter />
                  </ProtectedRoute>
                }
              />
              
              {/* Patient interface — cada aba tem sua própria URL (botão voltar do Android) */}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute>
                    <PatientHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/:tab"
                element={
                  <ProtectedRoute>
                    <PatientHome />
                  </ProtectedRoute>
                }
              />
              
              {/* Angel interface */}
              <Route
                path="/angel"
                element={
                  <ProtectedRoute>
                    <AngelDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              
              {/* Patient suggestions */}
              <Route
                path="/suggestions"
                element={
                  <ProtectedRoute>
                    <PatientSuggestions />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/location-sharing-settings"
                element={
                  <ProtectedRoute>
                    <LocationSharingSettings />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </FontSizeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
