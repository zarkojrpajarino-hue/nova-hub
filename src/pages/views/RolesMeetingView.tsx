import { Calendar, Zap } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Member, PROJECTS, PROJECT_ROLES, ROLE_CONFIG } from '@/data/mockData';
import { Button } from '@/components/ui/button';

interface RolesMeetingViewProps {
  members: Member[];
  onNewOBV?: () => void;
}

export function RolesMeetingView({ members, onNewOBV }: RolesMeetingViewProps) {
  const roles = Object.entries(ROLE_CONFIG);

  const getMembersWithRole = (roleKey: string) => {
    const memberIds = PROJECT_ROLES
      .filter(pr => pr.role === roleKey)
      .map(pr => ({ memberId: pr.member_id, projectId: pr.project_id }));
    
    return memberIds.map(({ memberId, projectId }) => {
      const member = members.find(m => m.id === memberId);
      const project = PROJECTS.find(p => p.id === projectId);
      return { member, project };
    });
  };

  return (
    <>
      <NovaHeader 
        title="Reuniones de Rol" 
        subtitle="Descubre tu propósito profesional" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Banner */}
        <div className="nova-gradient-subtle nova-border rounded-2xl p-6 mb-8 flex items-center gap-5 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl nova-gradient flex items-center justify-center">
            <Calendar size={28} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Próxima Reunión de Rol: Lunes 27 Enero</h3>
            <p className="text-sm text-muted-foreground">
              Todos los miembros con el mismo rol de diferentes proyectos se reúnen para compartir aprendizajes.
            </p>
          </div>
          <Button className="nova-gradient">
            <Zap size={16} className="mr-1" />
            Generar Preguntas IA
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(([key, config], i) => {
            const membersWithRole = getMembersWithRole(key);
            
            return (
              <div 
                key={key}
                className="relative bg-card border border-border rounded-2xl p-6 cursor-pointer hover:-translate-y-0.5 hover:border-muted-foreground/30 transition-all animate-fade-in"
                style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
              >
                {/* Top accent */}
                <div 
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: config.color }}
                />

                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${config.color}20` }}
                >
                  <config.icon size={24} style={{ color: config.color }} />
                </div>

                <h3 className="font-bold text-lg mb-2">{config.label}</h3>
                <p className="text-sm text-muted-foreground mb-5">{config.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {membersWithRole.map(({ member, project }) => {
                    if (!member || !project) return null;
                    return (
                      <div 
                        key={`${member.id}-${project.id}`}
                        className="flex items-center gap-1.5 bg-background px-2.5 py-1.5 rounded-lg text-xs"
                      >
                        <div 
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-semibold text-white"
                          style={{ background: member.color }}
                        >
                          {member.nombre.charAt(0)}
                        </div>
                        <span>{member.nombre.split(' ')[0]}</span>
                        <span className="text-muted-foreground">•</span>
                        <span style={{ color: project.color }}>{project.icon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
