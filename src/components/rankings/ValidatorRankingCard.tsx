import { Shield, TrendingUp, Clock, AlertTriangle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAllValidatorStats } from '@/hooks/useValidationSystem';
import { Skeleton } from '@/components/ui/skeleton';

export function ValidatorRankingCard() {
  const { data: stats, isLoading } = useAllValidatorStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Ranking de Validadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by on-time rate
  const sortedStats = [...(stats || [])].sort((a, b) => {
    const totalA = a.total_validations || 0;
    const onTimeA = a.on_time_validations || 0;
    const totalB = b.total_validations || 0;
    const onTimeB = b.on_time_validations || 0;
    const rateA = totalA > 0 ? onTimeA / totalA : 1;
    const rateB = totalB > 0 ? onTimeB / totalB : 1;
    return rateB - rateA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Ranking de Validadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedStats.map((stat, index) => {
            const totalValidations = stat.total_validations || 0;
            const onTimeValidations = stat.on_time_validations || 0;
            const lateValidations = stat.late_validations || 0;
            const onTimeRate = totalValidations > 0
              ? Math.round((onTimeValidations / totalValidations) * 100)
              : 100;
            
            const isTop3 = index < 3;
            const profileColor = (stat.profile as { color?: string } | null)?.color || '#6366F1';
            const profileName = (stat.profile as { nombre?: string } | null)?.nombre || 'Usuario';
            
            return (
              <div 
                key={stat.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  stat.is_blocked 
                    ? 'bg-destructive/10 border border-destructive/30' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {/* Position */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isTop3 ? <Award size={14} /> : index + 1}
                </div>

                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                  style={{ backgroundColor: profileColor }}
                >
                  {profileName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {profileName}
                    </p>
                    {stat.is_blocked && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle size={10} className="mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress 
                      value={onTimeRate} 
                      className="h-1.5 flex-1"
                    />
                    <span className={`text-xs font-medium ${
                      onTimeRate >= 80 ? 'text-success' : 
                      onTimeRate >= 50 ? 'text-warning' : 
                      'text-destructive'
                    }`}>
                      {onTimeRate}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right text-xs space-y-1">
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp size={10} />
                    {onTimeValidations}
                  </div>
                  {lateValidations > 0 && (
                    <div className="flex items-center gap-1 text-destructive">
                      <Clock size={10} />
                      {lateValidations}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sortedStats.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No hay datos de validación aún
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
