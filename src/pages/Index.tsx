import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NovaSidebar } from '@/components/nova/NovaSidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DashboardView } from './views/DashboardView';
import { MiEspacioView } from './views/MiEspacioView';
import { MiDesarrolloView } from './views/MiDesarrolloView';
import { ProjectsView } from './views/ProjectsView';
import { OBVCenterView } from './views/OBVCenterView';
import { CRMView } from './views/CRMView';
import { FinancieroView } from './views/FinancieroView';
import { KPIsView } from './views/KPIsView';
import { RolesMeetingView } from './views/RolesMeetingView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { NotificationsView } from './views/NotificationsView';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function IndexContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useSearch();

  const handleNewOBV = () => {
    setCurrentView('obvs');
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSidebarOpen(false);
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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNewOBV={handleNewOBV} />;
      case 'mi-espacio':
        return <MiEspacioView onNewOBV={handleNewOBV} />;
      case 'mi-desarrollo':
        return <MiDesarrolloView />;
      case 'proyectos':
        return <ProjectsView onNewOBV={handleNewOBV} />;
      case 'obvs':
        return <OBVCenterView onNewOBV={handleNewOBV} />;
      case 'crm':
        return <CRMView onNewOBV={handleNewOBV} />;
      case 'financiero':
        return <FinancieroView onNewOBV={handleNewOBV} />;
      case 'kpis':
        return <KPIsView onNewOBV={handleNewOBV} />;
      case 'analytics':
        return <AnalyticsView onNewOBV={handleNewOBV} />;
      case 'roles':
        return <RolesMeetingView onNewOBV={handleNewOBV} />;
      case 'settings':
        return <SettingsView onNewOBV={handleNewOBV} />;
      case 'notificaciones':
        return <NotificationsView onNewOBV={handleNewOBV} onNavigate={handleNavigate} />;
      default:
        return <DashboardView onNewOBV={handleNewOBV} />;
    }
  };

  return (
    <NavigationProvider onNavigate={handleNavigate}>
      <div className="flex min-h-screen bg-background">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg"
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
          isMobile && !sidebarOpen && "-translate-x-full"
        )}>
          <NovaSidebar 
            currentView={currentView} 
            setCurrentView={handleNavigate} 
            currentUser={profile}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Main content */}
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          !isMobile && "ml-64"
        )}>
          {renderView()}
        </main>

        {/* Global Search */}
        <GlobalSearch open={searchOpen} onOpenChange={(open) => open ? openSearch() : closeSearch()} />
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
