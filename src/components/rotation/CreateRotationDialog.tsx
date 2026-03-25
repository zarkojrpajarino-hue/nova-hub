import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useProjectMembers, useProfiles } from '@/hooks/useNovaDataOptimized';
import { useCreateRotationRequest, useCalculateCompatibility, CompatibilityAnalysis } from '@/hooks/useRoleRotation';

import { useTranslation } from 'react-i18next';
interface CreateRotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabelKeys: Record<string, string> = {
  sales: 'rotation.ventas',
  finance: 'rotation.finanzas',
  ai_tech: 'rotation.aitech',
  marketing: 'rotation.marketing',
  operations: 'rotation.operaciones',
  strategy: 'rotation.estrategia',
};

export function CreateRotationDialog({ open, onOpenChange }: CreateRotationDialogProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: allMembers = [] } = useProjectMembers();
  const { data: profiles = [] } = useProfiles();
  
  const createMutation = useCreateRotationRequest();
  const compatibilityMutation = useCalculateCompatibility();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [compatibility, setCompatibility] = useState<CompatibilityAnalysis | null>(null);

  // Get user's memberships
  const myMemberships = allMembers.filter(m => m.member_id === profile?.id);
  
  // Get the selected membership
  const selectedMembership = myMemberships.find(m => m.project_id === selectedProjectId);

  // Get potential swap targets (users in any project with different role)
  const potentialTargets = allMembers.filter(m => 
    m.member_id !== profile?.id && 
    m.role !== selectedMembership?.role
  );

  // Get unique users from potential targets
  const uniqueTargetUsers = [...new Map(potentialTargets.map(m => {
    const userProfile = profiles.find(p => p.id === m.member_id);
    return [m.member_id, { 
      ...m, 
      profile: userProfile,
      project: projects.find(p => p.id === m.project_id)
    }];
  })).values()];

  const selectedTarget = uniqueTargetUsers.find(t => t.member_id === selectedTargetUserId);

  // Calculate compatibility when target changes
  useEffect(() => {
    if (selectedProjectId && selectedTargetUserId && selectedMembership && selectedTarget) {
      compatibilityMutation.mutate({
        user1Id: profile?.id || '',
        user2Id: selectedTargetUserId,
        role1: selectedMembership.role,
        role2: selectedTarget.role,
      }, {
        onSuccess: (data) => {
          setCompatibility(data);
        },
      });
    } else {
      setCompatibility(null);
    }
    // intentional: only recalculate when project or target selection changes; other deps are derived from these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, selectedTargetUserId]);

  const handleSubmit = () => {
    if (!selectedMembership || !selectedTarget || !profile?.id) return;

    createMutation.mutate({
      requester_id: profile.id,
      requester_project_id: selectedProjectId,
      requester_current_role: selectedMembership.role,
      target_user_id: selectedTargetUserId,
      target_project_id: selectedTarget.project_id,
      target_role: selectedTarget.role,
      request_type: 'swap',
      reason: reason || undefined,
      compatibility_score: compatibility?.score,
      compatibility_analysis: compatibility || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedProjectId('');
        setSelectedTargetUserId('');
        setReason('');
        setCompatibility(null);
      },
    });
  };

  const recommendationConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    highly_recommended: { 
      label: t('rotation.muyRecomendado'), 
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    recommended: { 
      label: t('rotation.recomendado'), 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    neutral: { 
      label: t('rotation.neutral'), 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="h-4 w-4" />
    },
    not_recommended: { 
      label: t('rotation.noRecomendado'), 
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <AlertCircle className="h-4 w-4" />
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />{t('rotation.nuevaSolicitudDeRotación')}</DialogTitle>
          <DialogDescription>{t('rotation.solicitaIntercambiarTuRol')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select Project */}
          <div className="space-y-2">
            <Label>{t('rotation.tuProyectoYRol')}</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={t('rotation.seleccionaTuProyecto')} />
              </SelectTrigger>
              <SelectContent>
                {myMemberships.map((membership) => {
                  const project = projects.find(p => p.id === membership.project_id);
                  return (
                    <SelectItem key={membership.id} value={membership.project_id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project?.color || '#6366F1' }}
                        />
                        <span>{project?.nombre}</span>
                        <Badge variant="outline" className="ml-2">
                          {roleLabelKeys[membership.role] ? t(roleLabelKeys[membership.role]) : membership.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Select Target User */}
          {selectedProjectId && (
            <div className="space-y-2">
              <Label>{t('rotation.intercambiarCon')}</Label>
              <Select value={selectedTargetUserId} onValueChange={setSelectedTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('rotation.seleccionaUnMiembro')} />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTargetUsers.map((target) => (
                    <SelectItem key={target.member_id} value={target.member_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={target.profile?.avatar || undefined} />
                          <AvatarFallback>
                            {target.profile?.nombre?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{target.profile?.nombre}</span>
                        <Badge variant="outline">
                          {roleLabelKeys[target.role] ? t(roleLabelKeys[target.role]) : target.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          en {target.project?.nombre}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Compatibility Analysis */}
          {compatibilityMutation.isPending && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">{t('rotation.analizandoCompatibilidad')}</span>
            </div>
          )}

          {compatibility && (
            <Card className={`border ${recommendationConfig[compatibility.recommendation]?.color || ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {recommendationConfig[compatibility.recommendation]?.icon}
                    <span className="font-medium">
                      {recommendationConfig[compatibility.recommendation]?.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold">{Math.round(compatibility.score)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('rotation.tuRendimiento')}</p>
                    <p className="font-medium">{compatibility.user1_performance?.toFixed(0) || 50}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('rotation.suRendimiento')}</p>
                    <p className="font-medium">{compatibility.user2_performance?.toFixed(0) || 50}%</p>
                  </div>
                </div>

                {compatibility.risks && compatibility.risks.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Riesgos identificados:</p>
                    <div className="flex flex-wrap gap-1">
                      {compatibility.risks.map((risk, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('rotation.porQuéQuieresHacer')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('rotation.cancelar')}</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedProjectId || !selectedTargetUserId || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
