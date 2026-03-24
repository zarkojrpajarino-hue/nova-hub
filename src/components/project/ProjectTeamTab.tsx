import { memo, useState } from 'react';
import { Users, Crown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_CONFIG } from '@/data/mockData';
import type { Project } from '@/hooks/useNovaDataOptimized';
import { InviteLinkDialog } from '@/components/roles/InviteLinkDialog';
import { ProjectLifecycleActions } from './ProjectLifecycleActions';
import { MembersNudge } from '@/components/subscription/MembersNudge';
import { useTranslation } from 'react-i18next';
interface TeamMemberDisplay {
  id: string;
  nombre: string;
  role: string;
  color?: string;
  isLead?: boolean;
  email?: string;
  obvs?: number;
  facturacion?: number;
  margen?: number;
}

interface ProjectTeamTabProps {
  project: Project;
  teamMembers: TeamMemberDisplay[];
}

function ProjectTeamTabComponent({ project, teamMembers }: ProjectTeamTabProps) {
  const { t } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);

  const membersByRole = teamMembers.reduce((acc: Record<string, TeamMemberDisplay[]>, member: TeamMemberDisplay) => {
    if (!acc[member.role]) acc[member.role] = [];
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, TeamMemberDisplay[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <MembersNudge currentMemberCount={teamMembers.length} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-primary" />
            <h3 className="font-semibold">Equipo de {project.nombre}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-3.5 w-3.5" />{t('project.invitar')}</Button>
            <ProjectLifecycleActions
              projectId={project.id}
              isPaused={!!project.paused_at}
              isArchived={!!project.archived_at}
            />
          </div>
        </div>

        <InviteLinkDialog
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          projectId={project.id}
        />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamMembers.map((member: TeamMemberDisplay) => {
              const roleConfig = ROLE_CONFIG[member.role];

              return (
                <div 
                  key={member.id}
                  className="bg-background border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                      style={{ background: member.color || '#6366F1' }}
                    >
                      {member.nombre?.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{member.nombre}</h4>
                        {member.isLead && (
                          <Crown size={14} className="text-warning" />
                        )}
                      </div>
                      
                      {roleConfig && (
                        <div 
                          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ 
                            background: `${roleConfig.color}20`,
                            color: roleConfig.color 
                          }}
                        >
                          <roleConfig.icon size={14} />
                          {roleConfig.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member stats in this project */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="font-bold">{member.obvs || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t('project.obvs')}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">€{Number(member.facturacion || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t('project.fact')}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">€{Number(member.margen || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t('project.margen')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roles Legend */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">{t('project.rolesDelEquipo')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => {
            const count = membersByRole[key]?.length || 0;
            return (
              <div 
                key={key}
                className="p-4 bg-background rounded-xl text-center"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${config.color}20` }}
                >
                  <config.icon size={20} style={{ color: config.color }} />
                </div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">{count} asignados</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectTeamTab = memo(ProjectTeamTabComponent);
