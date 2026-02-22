import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ROLE_CONFIG } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface EnrichedRanking {
  id: string;
  role_name: string;
  user_id: string;
  project_id: string;
  ranking_position: number;
  score: number;
  previous_position: number | null;
  userName: string;
  userAvatar: string | null;
  userColor: string;
  projectName: string;
  projectColor: string;
  performance?: {
    task_completion_rate: number;
    validated_obvs: number;
    lead_conversion_rate: number;
  };
}

interface RankingLeaderboardProps {
  rankings: EnrichedRanking[];
  currentUserId?: string;
}

const POSITION_STYLES = {
  1: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  2: { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' },
  3: { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10', border: 'border-amber-700/30' },
};

export function RankingLeaderboard({ rankings, currentUserId }: RankingLeaderboardProps) {
  const getPositionChange = (current: number, previous: number | null) => {
    if (previous === null) return null;
    const change = previous - current;
    if (change > 0) return { icon: TrendingUp, color: 'text-success', value: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: 'text-destructive', value: `${change}` };
    return { icon: Minus, color: 'text-muted-foreground', value: '=' };
  };

  if (rankings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <Trophy size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Sin rankings disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Los rankings se calculan automáticamente basados en el rendimiento
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group rankings by role
  const rankingsByRole = rankings.reduce((acc, ranking) => {
    if (!acc[ranking.role_name]) {
      acc[ranking.role_name] = [];
    }
    acc[ranking.role_name].push(ranking);
    return acc;
  }, {} as Record<string, EnrichedRanking[]>);

  return (
    <div className="space-y-6">
      {Object.entries(rankingsByRole).map(([roleName, roleRankings]) => {
        const roleConfig = ROLE_CONFIG[roleName];
        const RoleIcon = roleConfig?.icon || Trophy;

        return (
          <Card key={roleName}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${roleConfig?.color || '#6366F1'}20` }}
                >
                  <RoleIcon size={20} style={{ color: roleConfig?.color || '#6366F1' }} />
                </div>
                <div>
                  <CardTitle className="text-base">{roleConfig?.label || roleName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{roleRankings.length} participantes</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {roleRankings.slice(0, 10).map((ranking) => {
                  const positionStyle = POSITION_STYLES[ranking.ranking_position as keyof typeof POSITION_STYLES];
                  const positionChange = getPositionChange(ranking.ranking_position, ranking.previous_position);
                  const isCurrentUser = ranking.user_id === currentUserId;
                  const PositionIcon = positionStyle?.icon;

                  return (
                    <div
                      key={ranking.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg transition-all",
                        positionStyle?.bg || "bg-muted/30",
                        positionStyle?.border && `border ${positionStyle.border}`,
                        isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      {/* Position */}
                      <div className="w-12 flex items-center justify-center">
                        {PositionIcon ? (
                          <PositionIcon size={24} className={positionStyle.color} />
                        ) : (
                          <span className="text-xl font-bold text-muted-foreground">
                            #{ranking.ranking_position}
                          </span>
                        )}
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 border-2" style={{ borderColor: ranking.userColor }}>
                          <AvatarImage src={ranking.userAvatar || undefined} />
                          <AvatarFallback style={{ background: ranking.userColor }}>
                            {ranking.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {ranking.userName}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">Tú</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ background: ranking.projectColor }}
                            />
                            {ranking.projectName}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Score</span>
                          <span className="text-sm font-bold">{Number(ranking.score).toFixed(0)}%</span>
                        </div>
                        <Progress value={Number(ranking.score)} className="h-1.5" />
                      </div>

                      {/* Performance metrics */}
                      {ranking.performance && (
                        <div className="hidden lg:flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <p className="font-semibold">{ranking.performance.task_completion_rate}%</p>
                            <p className="text-muted-foreground">Tareas</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{ranking.performance.validated_obvs}</p>
                            <p className="text-muted-foreground">OBVs</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{ranking.performance.lead_conversion_rate}%</p>
                            <p className="text-muted-foreground">Leads</p>
                          </div>
                        </div>
                      )}

                      {/* Position Change */}
                      {positionChange && (
                        <div className={cn("flex items-center gap-1", positionChange.color)}>
                          <positionChange.icon size={16} />
                          <span className="text-sm font-medium">{positionChange.value}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
