import { CheckCircle2, FileCheck, Users, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ROLE_CONFIG } from '@/data/mockData';
import type { RolePerformance } from '@/hooks/useDevelopment';

interface RolePerformanceCardProps {
  performance: RolePerformance;
  ranking?: { position: number; previousPosition: number | null };
}

export function RolePerformanceCard({ performance, ranking }: RolePerformanceCardProps) {
  const roleConfig = ROLE_CONFIG[performance.role_name];
  const RoleIcon = roleConfig?.icon || Target;
  
  const getPositionChange = () => {
    if (!ranking?.previousPosition) return null;
    const change = ranking.previousPosition - ranking.position;
    if (change > 0) return { icon: ArrowUp, color: 'text-success', text: `+${change}` };
    if (change < 0) return { icon: ArrowDown, color: 'text-destructive', text: `${change}` };
    return { icon: Minus, color: 'text-muted-foreground', text: '=' };
  };

  const positionChange = getPositionChange();

  return (
    <Card className="overflow-hidden">
      {/* Header with role color */}
      <div 
        className="h-1"
        style={{ background: roleConfig?.color || '#6366F1' }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${roleConfig?.color || '#6366F1'}20` }}
            >
              <RoleIcon size={20} style={{ color: roleConfig?.color || '#6366F1' }} />
            </div>
            <div>
              <CardTitle className="text-base">{roleConfig?.label || performance.role_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{performance.project_name}</p>
            </div>
          </div>
          
          {ranking && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold">#{ranking.position}</span>
                {positionChange && (
                  <positionChange.icon size={16} className={positionChange.color} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Ranking</p>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Puntuación General</span>
            <span className="text-sm font-bold">{performance.performance_score}%</span>
          </div>
          <Progress value={performance.performance_score} className="h-2" />
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <CheckCircle2 size={18} className="mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{performance.task_completion_rate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Tareas</p>
            <p className="text-xs text-muted-foreground">
              {performance.completed_tasks}/{performance.total_tasks}
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <FileCheck size={18} className="mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{performance.validated_obvs}</p>
            <p className="text-[10px] text-muted-foreground uppercase">OBVs</p>
            <p className="text-xs text-muted-foreground">
              €{performance.total_facturacion.toFixed(0)}
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Users size={18} className="mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{performance.lead_conversion_rate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
            <p className="text-xs text-muted-foreground">
              {performance.leads_ganados}/{performance.total_leads}
            </p>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {performance.is_lead && (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
              Lead del Proyecto
            </Badge>
          )}
          {performance.role_accepted ? (
            <Badge variant="secondary" className="bg-success/10 text-success">
              Rol Aceptado
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Pendiente de Aceptar
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
