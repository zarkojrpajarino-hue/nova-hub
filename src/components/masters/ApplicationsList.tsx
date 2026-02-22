import { memo, useRef, useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useVoteOnApplication, useMasterVotes, type MasterApplication } from '@/hooks/useMasters';
import { ROLE_CONFIG } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ApplicationsListProps {
  applications: MasterApplication[];
  profiles: Array<{ id: string; nombre: string; avatar: string | null; color: string }>;
  currentUserId?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  voting: { label: 'En Votación', color: 'bg-amber-500/10 text-amber-500' },
  approved: { label: 'Aprobada', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rechazada', color: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expirada', color: 'bg-muted text-muted-foreground' },
};

export function ApplicationsList({ applications, profiles, currentUserId }: ApplicationsListProps) {
  const voteOnApplication = useVoteOnApplication();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: applications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400,
    overscan: 2,
  });

  if (applications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <Clock size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Sin aplicaciones pendientes</h3>
          <p className="text-sm text-muted-foreground">
            No hay aplicaciones en votación actualmente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={parentRef} className="h-[800px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const application = applications[virtualItem.index];
          const applicant = profiles.find(p => p.id === application.user_id);
          const roleConfig = ROLE_CONFIG[application.role_name];
          const statusConfig = STATUS_CONFIG[application.status];
          const isOwnApplication = application.user_id === currentUserId;
          const votesProgress = ((application.votes_for + application.votes_against) / 8) * 100;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-1 pb-4"
            >
              <ApplicationCard
                application={application}
                applicant={applicant}
                roleConfig={roleConfig}
                statusConfig={statusConfig}
                isOwnApplication={isOwnApplication}
                votesProgress={votesProgress}
                currentUserId={currentUserId}
                onVote={voteOnApplication.mutateAsync}
                isVoting={voteOnApplication.isPending}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  application: MasterApplication;
  applicant?: { id: string; nombre: string; avatar: string | null; color: string };
  roleConfig?: { label: string; color: string; icon: React.ElementType };
  statusConfig: { label: string; color: string };
  isOwnApplication: boolean;
  votesProgress: number;
  currentUserId?: string;
  onVote: (vote: { application_id: string; voter_id: string; vote: boolean; comentario?: string }) => Promise<unknown>;
  isVoting: boolean;
}

const ApplicationCard = memo(function ApplicationCard({
  application,
  applicant,
  roleConfig,
  statusConfig,
  isOwnApplication,
  votesProgress,
  currentUserId,
  onVote,
  isVoting,
}: ApplicationCardProps) {
  const [comment, setComment] = useState('');
  const { data: votes = [] } = useMasterVotes(application.id);
  
  const hasVoted = votes.some(v => v.voter_id === currentUserId);
  const RoleIcon = roleConfig?.icon;

  const handleVote = async (vote: boolean) => {
    if (!currentUserId || hasVoted || isOwnApplication) return;
    
    try {
      await onVote({
        application_id: application.id,
        voter_id: currentUserId,
        vote,
        comentario: comment || undefined,
      });
      toast.success(vote ? 'Voto a favor registrado' : 'Voto en contra registrado');
      setComment('');
    } catch (_error) {
      toast.error('Error al votar');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2" style={{ borderColor: applicant?.color || '#6366F1' }}>
              <AvatarImage src={applicant?.avatar || undefined} />
              <AvatarFallback style={{ background: applicant?.color || '#6366F1' }}>
                {applicant?.nombre?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{applicant?.nombre || 'Usuario'}</CardTitle>
                {isOwnApplication && <Badge variant="outline">Tu aplicación</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                {roleConfig && (
                  <Badge variant="outline" style={{ borderColor: roleConfig.color, color: roleConfig.color }}>
                    {RoleIcon && <RoleIcon size={12} className="mr-1" />}
                    {roleConfig.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: es })}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Motivation */}
        <div>
          <p className="text-sm font-medium mb-1">Motivación</p>
          <p className="text-sm text-muted-foreground">{application.motivation}</p>
        </div>
        
        {/* Achievements */}
        {application.achievements && application.achievements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Logros destacados</p>
            <div className="space-y-1">
              {application.achievements.map((achievement, i) => (
                <div key={i} className="text-sm bg-muted/50 rounded p-2">
                  <span className="font-medium">{achievement.title}</span>
                  {achievement.description && (
                    <span className="text-muted-foreground"> - {achievement.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Voting Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso de Votación</span>
            <span className="text-xs text-muted-foreground">
              {application.votes_for + application.votes_against}/8 votos ({application.votes_required} requeridos)
            </span>
          </div>
          <Progress value={votesProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm">
            <span className="text-success flex items-center gap-1">
              <ThumbsUp size={14} />
              {application.votes_for} a favor
            </span>
            <span className="text-destructive flex items-center gap-1">
              <ThumbsDown size={14} />
              {application.votes_against} en contra
            </span>
          </div>
        </div>
        
        {/* Vote Actions */}
        {application.status === 'voting' && !isOwnApplication && !hasVoted && currentUserId && (
          <div className="border-t pt-4 space-y-3">
            <Textarea
              placeholder="Añade un comentario (opcional)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-success hover:text-success hover:bg-success/10"
                onClick={() => handleVote(true)}
                disabled={isVoting}
              >
                {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp size={16} />}
                Aprobar
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleVote(false)}
                disabled={isVoting}
              >
                {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown size={16} />}
                Rechazar
              </Button>
            </div>
          </div>
        )}
        
        {hasVoted && (
          <div className="border-t pt-4">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 size={14} />
              Ya has votado
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
