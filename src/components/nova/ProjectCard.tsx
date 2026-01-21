import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG } from '@/data/mockData';

interface Project {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  fase: string;
  tipo: string;
  onboarding_completed?: boolean;
  members: string[];
}

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface ProjectRole {
  project_id: string;
  member_id: string;
  role: string;
}

interface ProjectCardProps {
  project: Project;
  members: Member[];
  roles: ProjectRole[];
  showRoles?: boolean;
}

export function ProjectCard({ project, members, roles, showRoles = false }: ProjectCardProps) {
  const navigate = useNavigate();
  
  // Only show members/roles if onboarding is completed
  const isReady = project.onboarding_completed;
  const projectMembers = isReady ? members.filter(m => project.members.includes(m.id)) : [];
  const projectRoles = isReady ? roles.filter(r => r.project_id === project.id) : [];

  const handleClick = () => {
    navigate(`/proyecto/${project.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="relative bg-card border border-border rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-xl hover:shadow-black/20 overflow-hidden group"
    >
      {/* Top accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: project.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${project.color}20` }}
        >
          {project.icon}
        </div>
        <span className={cn(
          "text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full",
          project.tipo === 'operacion' 
            ? "bg-success/15 text-success" 
            : "bg-warning/15 text-warning"
        )}>
          {project.tipo === 'operacion' ? 'Operación' : 'Validación'}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg mb-1">{project.nombre}</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Fase: {project.fase.replace('_', ' ')}
      </p>

      {/* Team Avatars or Onboarding Badge */}
      <div className="flex items-center mb-4 min-h-[32px]">
        {isReady ? (
          <>
            {projectMembers.slice(0, 5).map((member, i) => (
              <div 
                key={member.id}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs text-white border-2 border-card"
                style={{ 
                  background: member.color || '#6366F1',
                  marginLeft: i > 0 ? '-8px' : 0,
                  zIndex: projectMembers.length - i
                }}
                title={member.nombre}
              >
                {member.nombre?.charAt(0)}
              </div>
            ))}
            {projectMembers.length > 5 && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs bg-muted text-muted-foreground border-2 border-card" style={{ marginLeft: '-8px' }}>
                +{projectMembers.length - 5}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs font-medium text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full">
            🚀 Onboarding pendiente
          </span>
        )}
      </div>

      {/* Role badges - only show if ready */}
      {showRoles && isReady && projectRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {projectRoles.map(pr => {
            const role = ROLE_CONFIG[pr.role];
            const member = members.find(m => m.id === pr.member_id);
            if (!role || !member) return null;
            
            return (
              <div 
                key={pr.member_id}
                className="flex items-center gap-1.5 text-[11px] bg-background px-2 py-1 rounded-md"
              >
                <role.icon size={12} style={{ color: role.color }} />
                <span className="text-muted-foreground">{member.nombre?.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div className="text-center">
          <p className="font-bold text-lg">-</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">OBVs</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">-</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Leads</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">-</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Facturado</p>
        </div>
      </div>
    </div>
  );
}
