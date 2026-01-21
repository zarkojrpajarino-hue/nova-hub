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
import { useMemberStats, useProjects, useProjectMembers, useObjectives } from '@/hooks/useNovaData';
import { MEMBERS, PROJECTS, PROJECT_ROLES, OBJECTIVES } from '@/data/mockData';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch data from Supabase (with fallback to mock data)
  const { data: dbMembers } = useMemberStats();
  const { data: dbProjects } = useProjects();
  const { data: dbProjectMembers } = useProjectMembers();
  const { data: dbObjectives } = useObjectives();

  // Use database data if available, otherwise fall back to mock data
  const members = dbMembers && dbMembers.length > 0 
    ? dbMembers.map(m => ({
        id: m.id,
        nombre: m.nombre,
        email: m.email,
        color: m.color || '#6366F1',
        lps: Number(m.lps) || 0,
        bps: Number(m.bps) || 0,
        obvs: Number(m.obvs) || 0,
        cps: Number(m.cps) || 0,
        facturacion: Number(m.facturacion) || 0,
        margen: Number(m.margen) || 0,
        avatar: m.avatar,
      }))
    : MEMBERS;

  const projects = dbProjects && dbProjects.length > 0
    ? dbProjects.map(p => ({
        id: p.id,
        nombre: p.nombre,
        icon: p.icon,
        color: p.color,
        fase: p.fase,
        tipo: p.tipo,
        onboarding_completed: p.onboarding_completed,
        members: [] as string[], // Will be filled from project_members
      }))
    : PROJECTS;

  const projectRoles = dbProjectMembers && dbProjectMembers.length > 0
    ? dbProjectMembers.map(pm => ({
        project_id: pm.project_id,
        member_id: pm.member_id,
        role: pm.role,
      }))
    : PROJECT_ROLES;

  // Create a current user object from profile
  const currentUser = profile ? {
    id: profile.id,
    nombre: profile.nombre,
    email: profile.email,
    color: profile.color || '#6366F1',
    lps: 0,
    bps: 0,
    obvs: 0,
    cps: 0,
    facturacion: 0,
    margen: 0,
    avatar: profile.avatar,
  } : MEMBERS[0];

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
        return <DashboardView members={members} onNewOBV={handleNewOBV} />;
      case 'mi-espacio':
        return <MiEspacioView currentUser={currentUser} projects={projects} onNewOBV={handleNewOBV} />;
      case 'proyectos':
        return <ProjectsView projects={projects} members={members} onNewOBV={handleNewOBV} />;
      case 'obvs':
        return <OBVCenterView onNewOBV={handleNewOBV} />;
      case 'crm':
        return <CRMView onNewOBV={handleNewOBV} />;
      case 'financiero':
        return <FinancieroView members={members} onNewOBV={handleNewOBV} />;
      case 'kpis':
        return <KPIsView members={members} onNewOBV={handleNewOBV} />;
      case 'roles':
        return <RolesMeetingView members={members} onNewOBV={handleNewOBV} />;
      default:
        return <DashboardView members={members} onNewOBV={handleNewOBV} />;
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
