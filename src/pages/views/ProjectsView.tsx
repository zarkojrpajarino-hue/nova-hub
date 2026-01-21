import { Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { ProjectCard } from '@/components/nova/ProjectCard';
import { useProjects, useProjectMembers, useMemberStats } from '@/hooks/useNovaData';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_PROJECTS, DEMO_MEMBERS } from '@/data/demoData';

interface ProjectsViewProps {
  onNewOBV?: () => void;
}

export function ProjectsView({ onNewOBV }: ProjectsViewProps) {
  const { isDemoMode } = useDemoMode();
  const { data: realProjects = [], isLoading: loadingProjects } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: realMembers = [] } = useMemberStats();

  // Use demo data when in demo mode
  const projects = isDemoMode ? DEMO_PROJECTS : realProjects;
  const members = isDemoMode ? DEMO_MEMBERS : realMembers;

  // Transform data for ProjectCard compatibility
  const projectsWithMembers = isDemoMode 
    ? DEMO_PROJECTS.map(p => ({
        ...p,
        members: DEMO_MEMBERS.slice(0, p.miembros).map(m => m.id),
      }))
    : realProjects.map(p => ({
        ...p,
        members: projectMembers
          .filter(pm => pm.project_id === p.id)
          .map(pm => pm.member_id),
      }));

  const membersForCard = members.map(m => ({
    id: m.id,
    nombre: m.nombre,
    email: m.email || `${m.nombre.toLowerCase().replace(' ', '.')}@nova.com`,
    color: m.color || '#6366F1',
    avatar: m.avatar || null,
    lps: Number(m.lps) || 0,
    bps: Number(m.bps) || 0,
    obvs: Number(m.obvs) || 0,
    cps: Number(m.cps) || 0,
    exploracion: 0,
    validacion: 0,
    venta: 0,
    facturacion: Number(m.facturacion) || 0,
    margen: Number(m.margen) || 0,
  }));

  const projectRoles = isDemoMode 
    ? DEMO_PROJECTS.flatMap(p => 
        DEMO_MEMBERS.slice(0, p.miembros).map((m, i) => ({
          project_id: p.id,
          member_id: m.id,
          role: ['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy'][i % 6],
        }))
      )
    : projectMembers.map(pm => ({
        project_id: pm.project_id,
        member_id: pm.member_id,
        role: pm.role,
      }));

  if (loadingProjects && !isDemoMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="Proyectos" 
        subtitle={`Gestiona los ${projects.length} proyectos activos del equipo`}
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        <SectionHelp section="proyectos" variant="inline" />

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No hay proyectos creados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectsWithMembers.map((project, i) => (
              <div 
                key={project.id} 
                className="animate-fade-in"
                style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
              >
                <ProjectCard 
                  project={project}
                  members={membersForCard}
                  roles={projectRoles}
                  showRoles
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <HelpWidget section="proyectos" />
    </>
  );
}
