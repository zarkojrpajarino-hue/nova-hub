import { useState } from 'react';
import { Check, X, Loader2, UserCheck, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  member_id: string;
  nombre: string;
  color: string;
  role: string;
  role_accepted: boolean;
  role_responsibilities?: string[];
}

interface RoleAcceptanceGateProps {
  project: {
    id: string;
    nombre: string;
    color: string;
    icon: string;
  };
  currentUserId?: string;
  teamMembers: TeamMember[];
}

export function RoleAcceptanceGate({ project, currentUserId, teamMembers }: RoleAcceptanceGateProps) {
  const queryClient = useQueryClient();
  const [isAccepting, setIsAccepting] = useState(false);

  const currentMember = teamMembers.find(m => m.member_id === currentUserId);
  const allAccepted = teamMembers.every(m => m.role_accepted);
  const acceptedCount = teamMembers.filter(m => m.role_accepted).length;
  const roleConfig = currentMember?.role ? ROLE_CONFIG[currentMember.role] : null;

  const handleAcceptRole = async () => {
    if (!currentMember) return;
    
    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ 
          role_accepted: true,
          role_accepted_at: new Date().toISOString(),
        })
        .eq('project_id', project.id)
        .eq('member_id', currentUserId);

      if (error) throw error;

      toast.success('¡Rol aceptado!');
      
      // IMPORTANTE: Esperar invalidación y forzar refetch
      await queryClient.invalidateQueries({ queryKey: ['project_members'] });
      await queryClient.refetchQueries({ queryKey: ['project_members'] });
      
    } catch (error) {
      console.error('Error accepting role:', error);
      toast.error('Error al aceptar el rol');
    } finally {
      setIsAccepting(false);
    }
  };

  if (allAccepted) {
    return null; // All roles accepted, show normal project
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full overflow-hidden">
        <CardHeader 
          className="text-center border-b"
          style={{ background: `linear-gradient(135deg, ${project.color}15 0%, transparent 100%)` }}
        >
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${project.color}25` }}
            >
              {project.icon}
            </div>
            <div>
              <CardTitle className="text-2xl">{project.nombre}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Esperando aceptación de roles del equipo
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Progress */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
              <UserCheck size={18} className="text-primary" />
              <span className="font-medium">{acceptedCount} de {teamMembers.length} roles aceptados</span>
            </div>
          </div>

          {/* Team Status */}
          <div className="grid gap-3">
            {teamMembers.map((member) => {
              const config = ROLE_CONFIG[member.role];
              const isCurrentUser = member.member_id === currentUserId;
              
              return (
                <div 
                  key={member.member_id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                    isCurrentUser 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-card border-border"
                  )}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                    style={{ background: member.color || '#6366F1' }}
                  >
                    {member.nombre?.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{member.nombre}</span>
                      {isCurrentUser && (
                        <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                      )}
                    </div>
                    {config && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <config.icon size={14} style={{ color: config.color }} />
                        <span className="text-sm text-muted-foreground">{config.label}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    {member.role_accepted ? (
                      <div className="flex items-center gap-1.5 text-sm text-green-600">
                        <Check size={16} />
                        <span>Aceptado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock size={16} />
                        <span>Pendiente</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current User's Role Details */}
          {currentMember && !currentMember.role_accepted && roleConfig && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Tu rol asignado
                </h3>
              </div>
              
              <div 
                className="p-5 rounded-xl border-2 text-center"
                style={{ 
                  borderColor: roleConfig.color,
                  background: `${roleConfig.color}10`,
                }}
              >
                <roleConfig.icon 
                  size={40} 
                  style={{ color: roleConfig.color }}
                  className="mx-auto mb-3"
                />
                <h4 className="text-xl font-bold mb-1">{roleConfig.label}</h4>
                <p className="text-sm text-muted-foreground">{roleConfig.desc}</p>
              </div>

              {currentMember.role_responsibilities && currentMember.role_responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Tus responsabilidades:
                  </h4>
                  <ul className="space-y-2">
                    {(currentMember.role_responsibilities as string[]).map((resp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg"
                onClick={handleAcceptRole}
                disabled={isAccepting}
                style={{ background: roleConfig.color }}
              >
                {isAccepting ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Aceptando...
                  </>
                ) : (
                  <>
                    <Check size={20} className="mr-2" />
                    Aceptar rol de {roleConfig.label}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Already accepted message */}
          {currentMember?.role_accepted && (
            <div className="text-center py-6 space-y-2">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-600">¡Has aceptado tu rol!</h3>
              <p className="text-sm text-muted-foreground">
                Esperando a que el resto del equipo acepte sus roles...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
