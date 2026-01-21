import { useState } from 'react';
import { NovaSidebar } from '@/components/nova/NovaSidebar';
import { DashboardView } from './views/DashboardView';
import { MiEspacioView } from './views/MiEspacioView';
import { ProjectsView } from './views/ProjectsView';
import { OBVCenterView } from './views/OBVCenterView';
import { CRMView } from './views/CRMView';
import { FinancieroView } from './views/FinancieroView';
import { KPIsView } from './views/KPIsView';
import { RolesMeetingView } from './views/RolesMeetingView';
import { MEMBERS, PROJECTS } from '@/data/mockData';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser] = useState(MEMBERS[0]); // Zarko as default user

  const handleNewOBV = () => {
    setCurrentView('obvs');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView members={MEMBERS} onNewOBV={handleNewOBV} />;
      case 'mi-espacio':
        return <MiEspacioView currentUser={currentUser} projects={PROJECTS} onNewOBV={handleNewOBV} />;
      case 'proyectos':
        return <ProjectsView projects={PROJECTS} members={MEMBERS} onNewOBV={handleNewOBV} />;
      case 'obvs':
        return <OBVCenterView onNewOBV={handleNewOBV} />;
      case 'crm':
        return <CRMView onNewOBV={handleNewOBV} />;
      case 'financiero':
        return <FinancieroView members={MEMBERS} onNewOBV={handleNewOBV} />;
      case 'kpis':
        return <KPIsView members={MEMBERS} onNewOBV={handleNewOBV} />;
      case 'roles':
        return <RolesMeetingView members={MEMBERS} onNewOBV={handleNewOBV} />;
      default:
        return <DashboardView members={MEMBERS} onNewOBV={handleNewOBV} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <NovaSidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
      />
      <main className="flex-1 ml-64 min-h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
