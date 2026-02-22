import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_CONFIG } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EnrichedRanking {
  id: string;
  role_name: string;
  user_id: string;
  ranking_position: number;
  score: number;
  previous_position: number | null;
  userName: string;
  userColor: string;
  calculated_at: string;
}

interface RankingTrendsProps {
  rankings: EnrichedRanking[];
  selectedRole: string;
}

export function RankingTrends({ rankings, selectedRole }: RankingTrendsProps) {
  // Calculate movers (biggest position changes)
  const movers = useMemo(() => {
    return rankings
      .filter(r => r.previous_position !== null)
      .map(r => ({
        ...r,
        change: (r.previous_position || 0) - r.ranking_position,
      }))
      .filter(r => r.change !== 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 10);
  }, [rankings]);

  // Calculate role statistics
  const roleStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number; topPerformer: string }> = {};
    
    rankings.forEach(r => {
      if (!stats[r.role_name]) {
        stats[r.role_name] = { count: 0, avgScore: 0, topPerformer: '' };
      }
      stats[r.role_name].count++;
      stats[r.role_name].avgScore += Number(r.score);
      
      if (r.ranking_position === 1) {
        stats[r.role_name].topPerformer = r.userName;
      }
    });

    Object.keys(stats).forEach(role => {
      if (stats[role].count > 0) {
        stats[role].avgScore = stats[role].avgScore / stats[role].count;
      }
    });

    return stats;
  }, [rankings]);

  // Prepare chart data (score distribution by role)
  const chartData = useMemo(() => {
    const roles = selectedRole === 'all' 
      ? [...new Set(rankings.map(r => r.role_name))]
      : [selectedRole];

    // Create score ranges
    const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    
    return ranges.map(range => {
      const [min, max] = range.split('-').map(Number);
      const data: Record<string, number | string> = { range };
      
      roles.forEach(role => {
        const roleConfig = ROLE_CONFIG[role];
        const count = rankings.filter(
          r => r.role_name === role && Number(r.score) >= min && Number(r.score) <= max
        ).length;
        data[roleConfig?.label || role] = count;
      });
      
      return data;
    });
  }, [rankings, selectedRole]);

  const chartColors = useMemo(() => {
    const roles = selectedRole === 'all' 
      ? [...new Set(rankings.map(r => r.role_name))]
      : [selectedRole];
    
    return roles.map(role => ({
      name: ROLE_CONFIG[role]?.label || role,
      color: ROLE_CONFIG[role]?.color || '#6366F1',
    }));
  }, [rankings, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Biggest Movers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} className="text-success" />
            Mayores Movimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movers.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Sin cambios de posición registrados aún
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {movers.map((mover) => {
                const isUp = mover.change > 0;
                const roleConfig = ROLE_CONFIG[mover.role_name];
                
                return (
                  <div 
                    key={mover.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isUp ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: mover.userColor, color: 'white' }}
                    >
                      {mover.userName.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{mover.userName}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: roleConfig?.color, color: roleConfig?.color }}
                        >
                          {roleConfig?.label || mover.role_name}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1 font-bold ${isUp ? 'text-success' : 'text-destructive'}`}>
                      {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      <span>{isUp ? '+' : ''}{mover.change}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Estadísticas por Rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(roleStats).map(([roleName, stats]) => {
              const roleConfig = ROLE_CONFIG[roleName];
              const RoleIcon = roleConfig?.icon || Users;
              
              return (
                <div 
                  key={roleName}
                  className="p-4 rounded-xl border bg-muted/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${roleConfig?.color || '#6366F1'}20` }}
                    >
                      <RoleIcon size={20} style={{ color: roleConfig?.color || '#6366F1' }} />
                    </div>
                    <div>
                      <p className="font-semibold">{roleConfig?.label || roleName}</p>
                      <p className="text-xs text-muted-foreground">{stats.count} miembros</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score Promedio</span>
                      <span className="font-medium">{stats.avgScore.toFixed(0)}%</span>
                    </div>
                    {stats.topPerformer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Top Performer</span>
                        <span className="font-medium text-amber-500">{stats.topPerformer}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {chartColors.map(({ name, color }) => (
                  <Line 
                    key={name}
                    type="monotone" 
                    dataKey={name} 
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
