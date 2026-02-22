import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { NovaSidebar } from '@/components/nova/NovaSidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

// Lazy load views for better code splitting
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const MiEspacioView = lazy(() => import('./views/MiEspacioView').then(m => ({ default: m.MiEspacioView })));
const MiDesarrolloView = lazy(() => import('./views/MiDesarrolloView').then(m => ({ default: m.MiDesarrolloView })));
const RankingsView = lazy(() => import('./views/RankingsView').then(m => ({ default: m.RankingsView })));
const MastersView = lazy(() => import('./views/MastersView').then(m => ({ default: m.MastersView })));
const RoleRotationView = lazy(() => import('./views/RoleRotationView'));
const ProjectsView = lazy(() => import('./views/ProjectsView').then(m => ({ default: m.ProjectsView })));
const OBVCenterView = lazy(() => import('./views/OBVCenterView').then(m => ({ default: m.OBVCenterView })));
const CRMView = lazy(() => import('./views/CRMView').then(m => ({ default: m.CRMView })));
const FinancieroView = lazy(() => import('./views/FinancieroView').then(m => ({ default: m.FinancieroView })));
const KPIsView = lazy(() => import('./views/KPIsView').then(m => ({ default: m.KPIsView })));
const _RolesMeetingView = lazy(() => import('./views/RolesMeetingView').then(m => ({ default: m.RolesMeetingView })));
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const NotificationsView = lazy(() => import('./views/NotificationsView').then(m => ({ default: m.NotificationsView })));
const ValidacionesView = lazy(() => import('./views/ValidacionesView').then(m => ({ default: m.ValidacionesView })));
const IntegrationsView = lazy(() => import('./IntegrationsView'));
const ExplorationDashboard = lazy(() => import('./views/ExplorationDashboard').then(m => ({ default: m.ExplorationDashboard })));
const TeamPerformanceDashboard = lazy(() => import('./views/TeamPerformanceDashboard').then(m => ({ default: m.TeamPerformanceDashboard })));
const PathToMasterPage = lazy(() => import('./PathToMasterPage').then(m => ({ default: m.PathToMasterPage })));
const GenerativeOnboardingView = lazy(() => import('./views/GenerativeOnboardingView').then(m => ({ default: m.GenerativeOnboardingView })));
const UltraOnboardingView = lazy(() => import('./views/UltraOnboardingView').then(m => ({ default: m.UltraOnboardingView })));
const MeetingIntelligencePage = lazy(() => import('./MeetingIntelligencePage'));
const StartupOSView = lazy(() => import('./views/StartupOSView').then(m => ({ default: m.StartupOSView })));

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

  // Sincronizar el proyecto actual con el projectId de la URL
  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      // Aquí podrías cargar el proyecto desde la BD si no está en currentProject
      // Por ahora, solo verificamos que coincida
      console.log('Project ID from URL:', projectId);
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

  // ✨ OPTIMIZADO: Preloading inteligente de vistas frecuentes
  useEffect(() => {
    // Precargar vistas más usadas después de 2 segundos de la carga inicial
    const preloadTimer = setTimeout(() => {
      // Preload top 5 vistas más frecuentes
      import('./views/ProjectsView');
      import('./views/CRMView');
      import('./views/OBVCenterView');
      import('./views/ValidacionesView');
      import('./views/AnalyticsView');
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // ✨ OPTIMIZADO: Preload en hover del sidebar (predictivo)
  const handleMenuHover = (view: string) => {
    switch (view) {
      case 'proyectos':
        import('./views/ProjectsView');
        break;
      case 'startup-os':
        import('./views/StartupOSView');
        break;
      case 'crm':
        import('./views/CRMView');
        break;
      case 'obvs':
        import('./views/OBVCenterView');
        break;
      case 'validaciones':
        import('./views/ValidacionesView');
        break;
      case 'analytics':
        import('./views/AnalyticsView');
        break;
      case 'kpis':
        import('./views/KPIsView');
        break;
      case 'financiero':
        import('./views/FinancieroView');
        break;
      case 'masters':
        import('./views/MastersView');
        break;
      case 'rotacion':
        import('./views/RoleRotationView');
        break;
    }
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const { isDemoMode } = useDemoMode();

  return (
    <NavigationProvider
      onNavigate={handleNavigate}
      onGoBack={handleGoBack}
      canGoBack={canGoBack}
    >
      <div className="flex min-h-screen bg-background">
        {/* Demo Mode Banner */}
        <DemoModeBanner />

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "fixed left-4 z-[60] w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg",
              isDemoMode ? "top-16" : "top-4"
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
          isDemoMode && "pt-12"
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
          isDemoMode && "pt-12"
        )}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Rutas relativas al proyecto */}
              <Route index element={<DashboardView onNewOBV={handleNewOBV} />} />
              <Route path="mi-espacio" element={<MiEspacioView onNewOBV={handleNewOBV} />} />
              <Route path="mi-desarrollo" element={<MiDesarrolloView />} />
              <Route path="proyectos" element={<ProjectsView onNewOBV={handleNewOBV} />} />
              <Route path="generative-onboarding" element={<GenerativeOnboardingView />} />
              <Route path="ultra-onboarding" element={<UltraOnboardingView />} />
              <Route path="validaciones" element={<ValidacionesView onNewOBV={handleNewOBV} />} />
              <Route path="obvs" element={<OBVCenterView onNewOBV={handleNewOBV} />} />
              <Route path="crm" element={<CRMView onNewOBV={handleNewOBV} />} />
              <Route path="financiero" element={<FinancieroView onNewOBV={handleNewOBV} />} />
              <Route path="meetings" element={<MeetingIntelligencePage />} />
              <Route path="startup-os" element={<StartupOSView />} />
              <Route path="exploration" element={<ExplorationDashboard />} />
              <Route path="path-to-master" element={<PathToMasterPage />} />
              <Route path="rankings" element={<RankingsView />} />
              <Route path="masters" element={<MastersView />} />
              <Route path="rotacion" element={<RoleRotationView />} />
              <Route path="kpis" element={<KPIsView onNewOBV={handleNewOBV} />} />
              <Route path="analytics" element={<AnalyticsView onNewOBV={handleNewOBV} />} />
              <Route path="team-performance" element={<TeamPerformanceDashboard />} />
              <Route path="settings" element={<SettingsView onNewOBV={handleNewOBV} />} />
              <Route path="integrations" element={<IntegrationsView />} />
              <Route path="notificaciones" element={<NotificationsView onNewOBV={handleNewOBV} onNavigate={handleNavigate} />} />
            </Routes>
          </Suspense>
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
