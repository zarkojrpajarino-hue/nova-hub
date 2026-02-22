import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ROLE_CONFIG } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface MyRankingCardProps {
  ranking: {
    id: string;
    role_name: string;
    ranking_position: number;
    score: number;
    previous_position: number | null;
  };
  projectName: string;
  projectColor: string;
}

const POSITION_CONFIG = {
  1: { icon: Crown, color: 'text-amber-500', bg: 'from-amber-500/20 to-amber-500/5' },
  2: { icon: Medal, color: 'text-slate-400', bg: 'from-slate-400/20 to-slate-400/5' },
  3: { icon: Award, color: 'text-amber-700', bg: 'from-amber-700/20 to-amber-700/5' },
};

export function MyRankingCard({ ranking, projectName, projectColor }: MyRankingCardProps) {
  const roleConfig = ROLE_CONFIG[ranking.role_name];
  const RoleIcon = roleConfig?.icon || Trophy;
  const positionConfig = POSITION_CONFIG[ranking.ranking_position as keyof typeof POSITION_CONFIG];
  
  const getPositionChange = () => {
    if (ranking.previous_position === null) return null;
    const change = ranking.previous_position - ranking.ranking_position;
    if (change > 0) return { icon: TrendingUp, color: 'text-success', value: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: 'text-destructive', value: `${change}` };
    return { icon: Minus, color: 'text-muted-foreground', value: '=' };
  };

  const positionChange = getPositionChange();
  const PositionIcon = positionConfig?.icon;

  return (
    <Card className={cn(
      "overflow-hidden",
      positionConfig && `bg-gradient-to-br ${positionConfig.bg}`
    )}>
      <div 
        className="h-1"
        style={{ background: roleConfig?.color || '#6366F1' }}
      />
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${roleConfig?.color || '#6366F1'}20` }}
            >
              <RoleIcon size={20} style={{ color: roleConfig?.color || '#6366F1' }} />
            </div>
            <div>
              <p className="font-semibold">{roleConfig?.label || ranking.role_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ background: projectColor }}
                />
                {projectName}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1">
              {PositionIcon ? (
                <PositionIcon size={28} className={positionConfig.color} />
              ) : (
                <span className="text-3xl font-bold">#{ranking.ranking_position}</span>
              )}
            </div>
            {positionChange && (
              <div className={cn("flex items-center gap-0.5 text-sm", positionChange.color)}>
                <positionChange.icon size={14} />
                <span>{positionChange.value}</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Score</span>
            <span className="text-sm font-bold">{Number(ranking.score).toFixed(0)}%</span>
          </div>
          <Progress value={Number(ranking.score)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
