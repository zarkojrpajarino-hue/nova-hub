import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { OptimusLogo } from '@/components/brand/OptimusLogo';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { CurrentProjectProvider } from "@/contexts/CurrentProjectContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Page-level lazy imports — CORE routes only
const RootRedirect = lazy(() => import("./pages/RootRedirect").then(m => ({ default: m.RootRedirect })));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SelectProjectPage = lazy(() => import("./pages/SelectProjectPage").then(m => ({ default: m.SelectProjectPage })));
const SelectOnboardingTypePage = lazy(() => import("./pages/SelectOnboardingTypePage").then(m => ({ default: m.SelectOnboardingTypePage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const EmergencyOnboardingPage = lazy(() => import("./pages/EmergencyOnboardingPage").then(m => ({ default: m.EmergencyOnboardingPage })));
const PrimerInicioPage = lazy(() => import("./pages/PrimerInicioPage").then(m => ({ default: m.PrimerInicioPage })));

// ✨ OPTIMIZADO: Configuración de React Query mejorada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos (reducido de 5) - balance entre performance y frescura
      gcTime: 1000 * 60 * 15, // 15 minutos (reducido de 30) - libera memoria más rápido
      refetchOnWindowFocus: true, // ✨ Activado - datos siempre actualizados al volver
      refetchOnReconnect: true, // ✨ Activado - actualizar al reconectar
      retry: (failureCount, error) => {
        // Don't retry 4xx (client errors)
        if (error instanceof Error && 'statusCode' in error) {
          const statusCode = (error as Error & { statusCode: number }).statusCode;
          if (statusCode >= 400 && statusCode < 500) return false;
        }
        // AbortError from Supabase auth changes: DO retry — it resolves once auth settles
        return failureCount < 3;
      },
      networkMode: 'online', // Solo ejecutar queries cuando hay conexión
    },
    mutations: {
      // Configuración para mutaciones
      retry: 1,
      networkMode: 'online',
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <OptimusLogo size={48} className="animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <CurrentProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              }>
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />

                  {/* Root redirect post-login */}
                  <Route path="/home" element={<RootRedirect />} />

                  {/* Rutas de selección de proyecto (protegidas) */}
                  <Route
                    path="/select-onboarding-type"
                    element={
                      <ProtectedRoute>
                        <SelectOnboardingTypePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/select-project"
                    element={
                      <ProtectedRoute>
                        <SelectProjectPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* Onboarding */}
                  <Route path="/onboarding/:projectId" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                  <Route path="/emergency-onboarding/:projectId" element={<ProtectedRoute><EmergencyOnboardingPage /></ProtectedRoute>} />
                  <Route path="/proyecto/:projectId/primer-inicio" element={<ProtectedRoute><PrimerInicioPage /></ProtectedRoute>} />

                  {/* Main app shell */}
                  <Route path="/proyecto/:projectId/*" element={<ProtectedRoute><Index /></ProtectedRoute>} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
        </TooltipProvider>
      </CurrentProjectProvider>
    </DemoModeProvider>
  </QueryClientProvider>
  </AuthProvider>
</ErrorBoundary>
);

export default App;
