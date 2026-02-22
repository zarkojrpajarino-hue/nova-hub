import { useState } from 'react';
import { Calendar, Zap, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { useMemberStats, useProjects, useProjectMembers } from '@/hooks/useNovaData';
import { ROLE_CONFIG } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { AIRoleQuestionsGenerator } from '@/components/roles/AIRoleQuestionsGenerator';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { CaminoMasterPreviewModal } from '@/components/preview/CaminoMasterPreviewModal';

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
        subtitle="Sesiones cross-proyecto donde personas con el mismo rol comparten aprendizajes"
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8">
        {/* How it works */}
        <HowItWorks
          title="Cómo funciona"
          description="Reuniones periódicas por rol para compartir conocimiento entre proyectos"
          whatIsIt="Sistema de reuniones mensuales donde todas las personas con el mismo rol (ej: todos los CMOs, todos los CTOs) de DIFERENTES proyectos se juntan para compartir aprendizajes, mejores prácticas, y resolver problemas comunes. Rompe silos entre proyectos y acelera aprendizaje cross-funcional. IA genera preguntas personalizadas para cada rol basadas en performance actual."
          dataInputs={[
            {
              from: 'Proyectos',
              items: [
                'Quién tiene qué rol en cada proyecto',
                'Contexto de cada proyecto (industria, fase, desafíos)',
              ],
            },
            {
              from: 'Mi Desarrollo',
              items: [
                'Tu Fit Score en tu rol actual',
                'Áreas donde necesitas mejorar',
                'Performance reciente (tareas, OBVs)',
              ],
            },
            {
              from: 'Rankings',
              items: [
                'Quién es top performer en cada rol',
                'Métricas de performance por rol',
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Aprendizaje acelerado',
              items: [
                'Mejores prácticas compartidas entre proyectos',
                'Soluciones a problemas comunes del rol',
                'Mentoría de top performers a novatos',
              ],
            },
            {
              to: 'Preguntas IA personalizadas',
              items: [
                'IA genera agenda para cada reunión basada en performance',
                'Preguntas específicas según desafíos de cada miembro',
                'Temas prioritarios por resolver',
              ],
            },
            {
              to: 'Red profesional',
              items: [
                'Conexiones con otros en tu rol',
                'Potencial para colaboraciones cross-proyecto',
                'Apoyo peer-to-peer',
              ],
            },
          ]}
          nextStep={{
            action: 'Revisa próxima reunión de tu rol → Usa IA para generar preguntas → Asiste y comparte',
            destination: 'Aprendizajes se reflejan en Mi Desarrollo, mejoras en Rankings',
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

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

      {/* Preview Modal */}
      <CaminoMasterPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />

      <HelpWidget section="roles-meeting" />
    </>
  );
}
