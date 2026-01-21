import { NovaHeader } from '@/components/nova/NovaHeader';
import { ProjectCard } from '@/components/nova/ProjectCard';
import { Project, Member, PROJECT_ROLES } from '@/data/mockData';

interface ProjectsViewProps {
  projects: Project[];
  members: Member[];
  onNewOBV?: () => void;
}

export function ProjectsView({ projects, members, onNewOBV }: ProjectsViewProps) {
  return (
    <>
      <NovaHeader 
        title="Proyectos" 
        subtitle="Gestiona los 7 proyectos activos del equipo" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <div 
              key={project.id} 
              className="animate-fade-in"
              style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
            >
              <ProjectCard 
                project={project}
                members={members}
                roles={PROJECT_ROLES}
                showRoles
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
