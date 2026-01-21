import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NovaSidebar } from '@/components/nova/NovaSidebar';
import { DashboardView } from './views/DashboardView';
import { MiEspacioView } from './views/MiEspacioView';
import { ProjectsView } from './views/ProjectsView';
import { OBVCenterView } from './views/OBVCenterView';
import { CRMView } from './views/CRMView';
import { FinancieroView } from './views/FinancieroView';
import { KPIsView } from './views/KPIsView';
import { RolesMeetingView } from './views/RolesMeetingView';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNewOBV = () => {
    setCurrentView('obvs');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNewOBV={handleNewOBV} />;
      case 'mi-espacio':
        return <MiEspacioView onNewOBV={handleNewOBV} />;
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
      case 'roles':
        return <RolesMeetingView onNewOBV={handleNewOBV} />;
      default:
        return <DashboardView onNewOBV={handleNewOBV} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <NovaSidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={profile}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 ml-64 min-h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
