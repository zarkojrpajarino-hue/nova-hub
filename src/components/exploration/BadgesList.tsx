/**
 * BADGES LIST
 *
 * Muestra todos los logros/badges del usuario
 * Badges desbloqueados + por desbloquear
 */

import { Trophy, Lock, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MemberBadge {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_category: string;
  earned_at: string;
}

interface BadgeDefinition {
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_category: string;
  requirement_description: string;
  points_value: number;
  is_rare: boolean;
}

interface BadgesListProps {
  earnedBadges: MemberBadge[];
  allBadges: BadgeDefinition[];
}

const CATEGORY_CONFIG = {
  challenge: { label: 'Desafíos', color: 'text-red-500', icon: Trophy },
  phase: { label: 'Fases', color: 'text-blue-500', icon: Star },
  contribution: { label: 'Contribución', color: 'text-green-500', icon: Zap },
  achievement: { label: 'Logros', color: 'text-purple-500', icon: Trophy },
};

export function BadgesList({ earnedBadges, allBadges }: BadgesListProps) {
  const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));
  const totalPoints = earnedBadges.reduce((sum, b) => {
    const def = allBadges.find((d) => d.badge_key === b.badge_key);
    return sum + (def?.points_value || 0);
  }, 0);

  // Agrupar por categoría
  const grouped = allBadges.reduce((acc, badge) => {
    const category = badge.badge_category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, BadgeDefinition[]>);

  const completionPercent = (earnedBadges.length / allBadges.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{earnedBadges.length}</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Puntos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{Math.round(completionPercent)}%</p>
            <p className="text-sm text-muted-foreground">Completado</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso general</span>
          <span className="font-medium">
            {earnedBadges.length} / {allBadges.length}
          </span>
        </div>
        <Progress value={completionPercent} className="h-2" />
      </div>

      {/* Badges por Categoría */}
      {Object.entries(grouped).map(([category, badges]) => {
        const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
        const Icon = config?.icon || Trophy;
        const earnedInCategory = badges.filter((b) => earnedKeys.has(b.badge_key)).length;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-5 h-5', config?.color)} />
                  <span>{config?.label || category}</span>
                </div>
                <Badge variant="secondary">
                  {earnedInCategory} / {badges.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge) => {
                  const earned = earnedBadges.find((e) => e.badge_key === badge.badge_key);
                  const isEarned = !!earned;

                  return (
                    <div
                      key={badge.badge_key}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        isEarned
                          ? 'border-primary bg-primary/5 hover:bg-primary/10'
                          : 'border-dashed border-muted bg-muted/30 opacity-60 hover:opacity-80'
                      )}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center text-3xl',
                            isEarned ? 'bg-primary/10' : 'bg-muted grayscale'
                          )}
                        >
                          {isEarned ? badge.badge_icon : <Lock className="w-8 h-8" />}
                        </div>

                        {/* Name */}
                        <div>
                          <p className="font-semibold text-sm">{badge.badge_name}</p>
                          {badge.is_rare && (
                            <Badge variant="outline" className="text-xs mt-1">
                              ⭐ Raro
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {badge.badge_description}
                        </p>

                        {/* Requirement */}
                        {!isEarned && (
                          <p className="text-xs text-muted-foreground italic">
                            {badge.requirement_description}
                          </p>
                        )}

                        {/* Earned date */}
                        {earned && (
                          <p className="text-xs text-success">
                            {formatDistanceToNow(new Date(earned.earned_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        )}

                        {/* Points */}
                        <Badge variant="secondary" className="text-xs">
                          +{badge.points_value} pts
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Próximo Badge */}
      {earnedBadges.length < allBadges.length && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="text-amber-500" />
              Próximos Logros
            </h3>
            <div className="space-y-2 text-sm">
              {allBadges
                .filter((b) => !earnedKeys.has(b.badge_key))
                .slice(0, 3)
                .map((badge) => (
                  <div
                    key={badge.badge_key}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-2xl">{badge.badge_icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{badge.badge_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {badge.requirement_description}
                      </p>
                    </div>
                    <Badge variant="outline">+{badge.points_value}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
