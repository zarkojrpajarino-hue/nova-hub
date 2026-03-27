import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { NovaSidebar } from '@/components/nova/NovaSidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureErrorBoundary } from '@/components/shared/FeatureErrorBoundary';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { usePhaseTransitionNotification } from '@/hooks/usePhaseTransitionNotification';
import { PhaseTransitionModal } from '@/components/nova/PhaseTransitionModal';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';

// Lazy load views — only CORE routes (Phase 0-2 solo user flow)
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const OBVCenterView = lazy(() => import('./views/OBVCenterView').then(m => ({ default: m.OBVCenterView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

function IndexContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const isMobile = useIsMobile();
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useSearch();
  const { hasCompletedOnboarding, completeOnboarding, isLoading: isLoadingOnboarding } = useOnboarding();
  const { navigateTo, goBack, canGoBack, currentView: navCurrentView } = useNavigationHistory();
  const { currentProject } = useCurrentProject();

  const currentView = navCurrentView.view;

  // Phase transition feedback — detects upward phase/score changes via React Query cache
  const { phaseModal, closePhaseModal } = usePhaseTransitionNotification(projectId);

  // Sincronizar el proyecto actual con el projectId de la URL
  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      // Aquí podrías cargar el proyecto desde la BD si no está en currentProject
      // Por ahora, solo verificamos que coincida
    }
  }, [projectId, currentProject]);

  const handleNewOBV = () => {
    navigateTo('obvs');
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavigate = (view: string) => {
    navigateTo(view);
    setSidebarOpen(false);
  };

  const handleGoBack = () => {
    const previousView = goBack();
    if (!previousView) {
      navigateTo('dashboard');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: openSearch,
    onNewOBV: handleNewOBV,
    onEscape: () => {
      closeSearch();
      setSidebarOpen(false);
    },
  });

  // Preload OBVCenterView on hover
  const handleMenuHover = (view: string) => {
    if (view === 'obvs') import('./views/OBVCenterView');
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );


  return (
    <NavigationProvider
      onNavigate={handleNavigate}
      onGoBack={handleGoBack}
      canGoBack={canGoBack}
    >
      <div className="flex min-h-screen bg-background">
        {/* Demo Mode Banner */}

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "fixed left-4 z-[60] w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg",
              "top-4"
            )}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Backdrop for mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={cn(
          "transition-transform duration-300 ease-in-out",
          isMobile && "fixed z-50",
          isMobile && !sidebarOpen && "-translate-x-full",
                  )}>
          <NovaSidebar
            currentView={currentView}
            setCurrentView={handleNavigate}
            currentUser={profile}
            onSignOut={handleSignOut}
            onMenuHover={handleMenuHover}
            projectId={currentProject?.id}
          />
        </div>

        {/* Main content */}
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          !isMobile && "ml-64",
                  )}>
          {/* Trial Countdown Banner — visible on ALL pages */}
          {currentProject?.id && (
            <TrialCountdownBanner projectId={currentProject.id} className="mx-8 mt-4" />
          )}

          <FeatureErrorBoundary featureName="Main Content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* CORE routes only — Phase 0-2 solo user flow */}
              <Route index element={<DashboardView onNewOBV={handleNewOBV} />} />
              <Route path="obvs" element={<OBVCenterView onNewOBV={handleNewOBV} />} />
              <Route path="settings" element={<SettingsView onNewOBV={handleNewOBV} />} />
            </Routes>
          </Suspense>
          </FeatureErrorBoundary>
        </main>

        {/* Global Search */}
        <GlobalSearch open={searchOpen} onOpenChange={(open) => open ? openSearch() : closeSearch()} />

        {/* Welcome Modal - Onboarding */}
        {!isLoadingOnboarding && (
          <WelcomeModal
            open={!hasCompletedOnboarding}
            onComplete={completeOnboarding}
          />
        )}

        {/* Phase transition celebration modal */}
        <PhaseTransitionModal state={phaseModal} onClose={closePhaseModal} />
      </div>
    </NavigationProvider>
  );
}

const Index = () => (
  <SearchProvider>
    <IndexContent />
  </SearchProvider>
);

export default Index;
