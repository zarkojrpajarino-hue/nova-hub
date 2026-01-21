import { useState } from 'react';
import { Calendar, Zap, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { useMemberStats, useProjects, useProjectMembers } from '@/hooks/useNovaData';
import { ROLE_CONFIG } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { AIRoleQuestionsGenerator } from '@/components/roles/AIRoleQuestionsGenerator';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';

interface RolesMeetingViewProps {
  onNewOBV?: () => void;
}

interface RoleContext {
  role: string;
  roleLabel: string;
  roleDescription: string;
  members: Array<{ nombre: string; projectName: string }>;
}

export function RolesMeetingView({ onNewOBV }: RolesMeetingViewProps) {
  const { data: members = [], isLoading: loadingMembers } = useMemberStats();
  const { data: projects = [] } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const [selectedRole, setSelectedRole] = useState<RoleContext | null>(null);

  const roles = Object.entries(ROLE_CONFIG);

  const getMembersWithRole = (roleKey: string) => {
    const memberData = projectMembers
      .filter(pm => pm.role === roleKey)
      .map(pm => ({ memberId: pm.member_id, projectId: pm.project_id }));
    
    return memberData.map(({ memberId, projectId }) => {
      const member = members.find(m => m.id === memberId);
      const project = projects.find(p => p.id === projectId);
      return { member, project };
    });
  };

  const handleGenerateQuestions = (roleKey: string, config: typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]) => {
    const membersWithRole = getMembersWithRole(roleKey);
    const roleContext: RoleContext = {
      role: roleKey,
      roleLabel: config.label,
      roleDescription: config.desc,
      members: membersWithRole
        .filter(m => m.member && m.project)
        .map(m => ({
          nombre: m.member!.nombre,
          projectName: m.project!.nombre,
        })),
    };
    setSelectedRole(roleContext);
  };

  if (loadingMembers) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="Reuniones de Rol" 
        subtitle="Descubre tu propósito profesional" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        <SectionHelp section="roles-meeting" variant="inline" />

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

                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${config.color}20` }}
                  >
                    <config.icon size={24} style={{ color: config.color }} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateQuestions(key, config);
                    }}
                  >
                    <Zap size={14} />
                    Preguntas IA
                  </Button>
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
                          style={{ background: member.color || '#6366F1' }}
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

      {/* AI Questions Modal */}
      <AIRoleQuestionsGenerator
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />

      <HelpWidget section="roles-meeting" />
    </>
  );
}
