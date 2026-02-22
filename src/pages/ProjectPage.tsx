import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, Users, Kanban, FileCheck,
  TrendingUp, Rocket, Target, Loader2, MoreVertical, Trash2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects, useProjectTeamMembers, useProjectStats, useProjectLeads } from '@/hooks/useNovaDataOptimized';
import { useAuth } from '@/hooks/useAuth';
import { ProjectDashboardTab } from '@/components/project/ProjectDashboardTab';
import { ProjectTeamTab } from '@/components/project/ProjectTeamTab';
import { ProjectCRMTab } from '@/components/project/ProjectCRMTab';
import { ProjectTasksTab } from '@/components/project/ProjectTasksTab';
import { ProjectOBVsTab } from '@/components/project/ProjectOBVsTab';
import { ProjectFinancialTab } from '@/components/project/ProjectFinancialTab';
import { ProjectOnboardingTab } from '@/components/project/ProjectOnboardingTab';
// import { OnboardingGate } from '@/components/project/OnboardingGate';
import { ProjectHelpMenu } from '@/components/project/ProjectHelpMenu';
import { HelpWidget } from '@/components/ui/section-help';
import { GeneratedBusinessDashboard } from '@/components/generative/GeneratedBusinessDashboard';
// RoleAcceptanceGate eliminado - los roles se auto-aceptan tras onboarding

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'tareas', label: 'Tareas', icon: Kanban },
  { id: 'obvs', label: 'OBVs', icon: FileCheck },
  { id: 'financiero', label: 'Financiero', icon: TrendingUp },
  { id: 'negocio-ia', label: 'Negocio IA', icon: Sparkles },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket },
];

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: projects = [], isLoading: loadingProject } = useProjects();

  // ✨ OPTIMIZADO: Usar hooks específicos por proyecto en lugar de globales
  const { data: teamMembersData = [] } = useProjectTeamMembers(projectId);
  const { data: stats } = useProjectStats(projectId);
  const { data: projectLeads = [] } = useProjectLeads(projectId);

  const project = projects.find(p => p.id === projectId);

  // ✨ OPTIMIZADO: Ya no necesitamos useMemo porque los datos ya vienen unidos
  // teamMembersData ya incluye member info gracias al JOIN en la query
  const teamMembers = useMemo(() => {
    return teamMembersData.map(tm => ({
      ...tm.member,
      member_id: tm.member_id,
      role: tm.role,
      isLead: tm.is_lead,
      role_accepted: tm.role_accepted,
      role_responsibilities: tm.role_responsibilities,
    }));
  }, [teamMembersData]);

  // Check if current user is a member
  const isProjectMember = teamMembers.some(m => m?.id === profile?.id);

  // Check project states (used in commented-out gates below)
  // const hasMembers = teamMembers.length > 0;
  // const allRolesAccepted = teamMembers.every(m => m?.role_accepted);
  // const isOnboardingComplete = project?.onboarding_completed;

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
  // TEMPORALMENTE DESHABILITADO PARA TESTING
  /*
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
        <OnboardingGate project={project} />
      </div>
    );
  }
  */

  // GATE 2: Eliminado - los roles se auto-aceptan tras completar onboarding

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

            {/* Help Menu */}
            <ProjectHelpMenu />

            {isProjectMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setActiveTab('onboarding')}
                    className="cursor-pointer"
                  >
                    <Rocket size={16} className="mr-2" />
                    Editar Onboarding
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeleteProjectDialog
                    projectId={project.id}
                    projectName={project.nombre}
                    trigger={
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar Proyecto
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-8 mb-6">
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

          <TabsContent value="negocio-ia">
            <GeneratedBusinessDashboard />
          </TabsContent>

          <TabsContent value="onboarding">
            <ProjectOnboardingTab
              project={project}
              isCompleted={project.onboarding_completed}
            />
          </TabsContent>
        </Tabs>
      </main>

      <HelpWidget section="project" />
    </div>
  );
}
