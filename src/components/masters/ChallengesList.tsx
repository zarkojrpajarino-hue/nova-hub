import { Swords, Clock, CheckCircle2, XCircle, Trophy, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_CONFIG } from '@/data/mockData';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';
import type { MasterChallenge, TeamMaster } from '@/hooks/useMasters';

import { useTranslation } from 'react-i18next';
interface ChallengesListProps {
  challenges: MasterChallenge[];
  masters: TeamMaster[];
  profiles: Array<{ id: string; nombre: string; avatar: string | null; color: string }>;
  currentUserId?: string;
}

const STATUS_CONFIG = {
  pending: { labelKey: 'masters.pendiente', color: 'bg-muted text-muted-foreground', icon: Clock },
  accepted: { labelKey: 'masters.aceptado', color: 'bg-amber-500/10 text-amber-500', icon: CheckCircle2 },
  in_progress: { labelKey: 'masters.enProgreso', color: 'bg-primary/10 text-primary', icon: Target },
  completed: { labelKey: 'masters.completado', color: 'bg-success/10 text-success', icon: Trophy },
  declined: { labelKey: 'masters.declinado', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { labelKey: 'masters.expirado', color: 'bg-muted text-muted-foreground', icon: Clock },
};

const TYPE_CONFIG = {
  performance: { labelKey: 'masters.rendimiento', descKey: 'masters.comparaciónDeMétricasDe' },
  project: { labelKey: 'masters.proyecto', descKey: 'masters.completarUnProyectoEspecífico' },
  peer_vote: { labelKey: 'masters.votación', descKey: 'masters.votaciónDelEquipo' },
};

const RESULT_CONFIG = {
  challenger_wins: { labelKey: 'masters.victoriaDelRetador', color: 'text-success', icon: Trophy },
  master_wins: { labelKey: 'masters.victoriaDelMaster', color: 'text-primary', icon: Trophy },
  draw: { labelKey: 'masters.empate', color: 'text-muted-foreground', icon: Target },
};

export function ChallengesList({ challenges, masters, profiles, currentUserId }: ChallengesListProps) {
  const { t } = useTranslation();
  if (challenges.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <Swords size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">{t('masters.sinDesafíosActivos')}</h3>
          <p className="text-sm text-muted-foreground">{t('masters.losDesafíosPermitenCompetir')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map(challenge => {
        const master = masters.find(m => m.id === challenge.master_id);
        const challenger = profiles.find(p => p.id === challenge.challenger_id);
        const masterProfile = profiles.find(p => p.id === master?.user_id);
        const roleConfig = ROLE_CONFIG[challenge.role_name];
        const statusConfig = STATUS_CONFIG[challenge.status];
        const typeConfig = TYPE_CONFIG[challenge.challenge_type];
        const resultConfig = challenge.result ? RESULT_CONFIG[challenge.result] : null;
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={challenge.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusConfig.color}>
                    <StatusIcon size={14} className="mr-1" />
                    {t(statusConfig.labelKey)}
                  </Badge>
                  <Badge variant="outline">
                    {t(typeConfig.labelKey)}
                  </Badge>
                  {roleConfig && (
                    <Badge variant="outline" style={{ borderColor: roleConfig.color, color: roleConfig.color }}>
                      {roleConfig.label}
                    </Badge>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                </span>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Participants */}
              <div className="flex items-center justify-center gap-8 mb-4">
                {/* Challenger */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2 border-2" style={{ borderColor: challenger?.color || '#6366F1' }}>
                    <AvatarImage src={challenger?.avatar || undefined} />
                    <AvatarFallback style={{ background: challenger?.color || '#6366F1' }} className="text-lg font-bold text-white">
                      {challenger?.nombre?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm">{challenger?.nombre || t('masters.retador0')}</p>
                  <p className="text-xs text-muted-foreground">{t('masters.retador')}</p>
                </div>
                
                {/* VS */}
                <div className="flex flex-col items-center">
                  <Swords size={32} className="text-destructive mb-1" />
                  <span className="text-xs font-bold text-muted-foreground">VS</span>
                </div>
                
                {/* Master */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-amber-500">
                    <AvatarImage src={masterProfile?.avatar || undefined} />
                    <AvatarFallback style={{ background: masterProfile?.color || '#F59E0B' }} className="text-lg font-bold text-white">
                      {masterProfile?.nombre?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm">{masterProfile?.nombre || t('masters.master1')}</p>
                  <p className="text-xs text-amber-500">{t('masters.master')}</p>
                </div>
              </div>
              
              {/* Description */}
              {challenge.description && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
              )}
              
              {/* Deadline */}
              {challenge.deadline && challenge.status !== 'completed' && (
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock size={14} />{t('masters.fechaLímite')}</span>
                  <span className="font-medium">
                    {format(new Date(challenge.deadline), 'PPP', { locale: getDateFnsLocale() })}
                  </span>
                </div>
              )}
              
              {/* Result */}
              {resultConfig && (
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 ${resultConfig.color}`}>
                  <resultConfig.icon size={20} />
                  <span className="font-semibold">{t(resultConfig.labelKey)}</span>
                </div>
              )}
              
              {/* Actions */}
              {challenge.status === 'pending' && master?.user_id === currentUserId && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 text-success hover:bg-success/10">{t('masters.aceptarDesafío')}</Button>
                  <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10">{t('masters.declinar')}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
