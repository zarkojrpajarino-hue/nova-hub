import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, LayoutDashboard, Users, Kanban, FileCheck, 
  TrendingUp, Rocket, Target, Loader2, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects, useProjectMembers, useMemberStats, useProjectStats, usePipelineGlobal } from '@/hooks/useNovaData';
import { useAuth } from '@/hooks/useAuth';
import { ProjectDashboardTab } from '@/components/project/ProjectDashboardTab';
import { ProjectTeamTab } from '@/components/project/ProjectTeamTab';
import { ProjectCRMTab } from '@/components/project/ProjectCRMTab';
import { ProjectTasksTab } from '@/components/project/ProjectTasksTab';
import { ProjectOBVsTab } from '@/components/project/ProjectOBVsTab';
import { ProjectFinancialTab } from '@/components/project/ProjectFinancialTab';
import { ProjectOnboardingTab } from '@/components/project/ProjectOnboardingTab';
import { OnboardingGate } from '@/components/project/OnboardingGate';
import { RoleAcceptanceGate } from '@/components/project/RoleAcceptanceGate';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'tareas', label: 'Tareas', icon: Kanban },
  { id: 'obvs', label: 'OBVs', icon: FileCheck },
  { id: 'financiero', label: 'Financiero', icon: TrendingUp },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket },
];

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: projects = [], isLoading: loadingProject } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: members = [] } = useMemberStats();
  const { data: projectStats = [] } = useProjectStats();
  const { data: allLeads = [] } = usePipelineGlobal();

  const project = projects.find(p => p.id === projectId);
  const stats = projectStats.find((s: any) => s.id === projectId);
  
  // Get project members with their info
  const teamMembers = useMemo(() => {
    return projectMembers
      .filter(pm => pm.project_id === projectId)
      .map(pm => {
        const member = members.find(m => m.id === pm.member_id);
        return member ? {
          ...member,
          member_id: pm.member_id,
          role: pm.role,
          isLead: pm.is_lead,
          role_accepted: pm.role_accepted,
          role_responsibilities: pm.role_responsibilities,
        } : null;
      })
      .filter(Boolean);
  }, [projectMembers, members, projectId]);

  // Get project leads
  const projectLeads = allLeads.filter(l => l.project_id === projectId);

  // Check if current user is a member
  const isProjectMember = teamMembers.some(m => m?.id === profile?.id);

  // Check project states
  const hasMembers = teamMembers.length > 0;
  const allRolesAccepted = teamMembers.every(m => m?.role_accepted);
  const isOnboardingComplete = project?.onboarding_completed;

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">Proyecto no encontrado</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // GATE 1: Onboarding not complete → show onboarding wizard
  if (!isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={20} />
              </Button>
              
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${project.color}20` }}
              >
                {project.icon}
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold">{project.nombre}</h1>
                <p className="text-sm text-muted-foreground">
                  Onboarding pendiente
                </p>
              </div>
            </div>
          </div>
        </header>
        <OnboardingGate project={project} hasMembers={hasMembers} />
      </div>
    );
  }

  // GATE 2: Onboarding complete but roles not accepted → show role acceptance
  if (isOnboardingComplete && !allRolesAccepted && hasMembers) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={20} />
              </Button>
              
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${project.color}20` }}
              >
                {project.icon}
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold">{project.nombre}</h1>
                <p className="text-sm text-muted-foreground">
                  Aceptación de roles pendiente
                </p>
              </div>
            </div>
          </div>
        </header>
        <RoleAcceptanceGate 
          project={project}
          currentUserId={profile?.id}
          teamMembers={teamMembers as any}
        />
      </div>
    );
  }

  // UNLOCKED: Show full project
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${project.color}20` }}
            >
              {project.icon}
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{project.nombre}</h1>
              <p className="text-sm text-muted-foreground">
                {project.fase} • {project.tipo === 'operacion' ? 'En operación' : 'En validación'}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-bold">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground">Miembros</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{stats?.total_obvs || 0}</p>
                <p className="text-xs text-muted-foreground">OBVs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-success">€{stats?.facturacion || 0}</p>
                <p className="text-xs text-muted-foreground">Facturado</p>
              </div>
            </div>

            {isProjectMember && (
              <Button variant="outline" size="icon">
                <Settings size={18} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 mb-6">
            {TABS.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2"
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <ProjectDashboardTab 
              project={project} 
              stats={stats}
              teamMembers={teamMembers}
              leadsCount={projectLeads.length}
            />
          </TabsContent>

          <TabsContent value="equipo">
            <ProjectTeamTab 
              project={project}
              teamMembers={teamMembers}
            />
          </TabsContent>

          <TabsContent value="crm">
            <ProjectCRMTab 
              projectId={projectId!}
              projectName={project?.nombre || ''}
            />
          </TabsContent>

          <TabsContent value="tareas">
            <ProjectTasksTab projectId={projectId!} project={project} />
          </TabsContent>

          <TabsContent value="obvs">
            <ProjectOBVsTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="financiero">
            <ProjectFinancialTab 
              project={project}
              stats={stats}
            />
          </TabsContent>

          <TabsContent value="onboarding">
            <ProjectOnboardingTab 
              project={project}
              isCompleted={project.onboarding_completed}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
