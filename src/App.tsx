import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { CurrentProjectProvider } from "@/contexts/CurrentProjectContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RootRedirect } from "./pages/RootRedirect";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index"; // Este será el layout del proyecto
import NotFound from "./pages/NotFound";
import { CreateFirstProjectPage } from "./pages/CreateFirstProjectPage";
import { SelectProjectPage } from "./pages/SelectProjectPage";
import { SelectOnboardingTypePage } from "./pages/SelectOnboardingTypePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DeepSetupPage } from "./pages/DeepSetupPage";
import EvidenceTestPage from "./pages/EvidenceTestPage";

// ✨ OPTIMIZADO: Configuración de React Query mejorada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos (reducido de 5) - balance entre performance y frescura
      gcTime: 1000 * 60 * 15, // 15 minutos (reducido de 30) - libera memoria más rápido
      refetchOnWindowFocus: true, // ✨ Activado - datos siempre actualizados al volver
      refetchOnReconnect: true, // ✨ Activado - actualizar al reconectar
      retry: (failureCount, error) => {
        // Retry inteligente: no reintentar errores 4xx (cliente)
        if (error instanceof Error && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500) return false;
        }
        return failureCount < 2; // Máximo 2 reintentos para errores 5xx
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
        <div className="w-12 h-12 nova-gradient rounded-xl flex items-center justify-center font-bold text-xl text-primary-foreground animate-pulse">
          N
        </div>
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
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <CurrentProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Root redirect - maneja lógica de redirección inicial */}
                <Route path="/" element={<RootRedirect />} />

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
                <Route
                  path="/create-first-project"
                  element={
                    <ProtectedRoute>
                      <CreateFirstProjectPage />
                    </ProtectedRoute>
                  }
                />

                {/* Onboarding standalone - Experiencia separada del dashboard */}
                <Route
                  path="/onboarding/:projectId"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Deep Setup standalone - Optional advanced onboarding */}
                <Route
                  path="/proyecto/:projectId/deep-setup/*"
                  element={
                    <ProtectedRoute>
                      <DeepSetupPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas del proyecto - TODAS las vistas van aquí */}
                <Route
                  path="/proyecto/:projectId/*"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />

                {/* Evidence System Test Page */}
                <Route
                  path="/evidence-test"
                  element={
                    <ProtectedRoute>
                      <EvidenceTestPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
        </TooltipProvider>
      </CurrentProjectProvider>
    </DemoModeProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;
