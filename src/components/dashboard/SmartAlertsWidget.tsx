import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, User, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles, useProjects, useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

interface Alert {
  id: string;
  type: 'inactive_member' | 'stale_leads' | 'goal_at_risk';
  severity: 'warning' | 'error';
  title: string;
  description: string;
  icon: typeof AlertTriangle;
}

export function SmartAlertsWidget() {
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const { data: memberStats = [] } = useMemberStats();
  const { data: objectives = [] } = useObjectives();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['smart_alerts', profiles.length, projects.length],
    queryFn: async () => {
      const alertsList: Alert[] = [];
      const today = new Date();
      const dayOfMonth = today.getDate();
      const isFirstHalf = dayOfMonth <= 15;

      // 1. Check for inactive members (5+ days without activity)
      const { data: recentActivity } = await supabase
        .from('obvs')
        .select('owner_id, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const lastActivityByMember = new Map<string, Date>();
      (recentActivity || []).forEach((a: { owner_id: string; created_at: string | null }) => {
        if (a.created_at && !lastActivityByMember.has(a.owner_id)) {
          lastActivityByMember.set(a.owner_id, new Date(a.created_at));
        }
      });

      profiles.forEach(member => {
        const lastActivity = lastActivityByMember.get(member.id);
        const daysSince = lastActivity 
          ? differenceInDays(today, lastActivity)
          : 999;
        
        if (daysSince >= 5) {
          alertsList.push({
            id: `inactive-${member.id}`,
            type: 'inactive_member',
            severity: daysSince >= 10 ? 'error' : 'warning',
            title: `${member.nombre} sin actividad`,
            description: lastActivity 
              ? `${daysSince} días sin registrar OBVs`
              : 'Sin actividad reciente',
            icon: User,
          });
        }
      });

      // 2. Check for leads without follow-up
      const { data: staleLeads } = await supabase
        .from('leads')
        .select('id, nombre, project_id, proxima_accion_fecha')
        .lt('proxima_accion_fecha', today.toISOString().split('T')[0])
        .neq('status', 'cerrado_ganado')
        .neq('status', 'cerrado_perdido')
        .limit(5);

      if (staleLeads && staleLeads.length > 0) {
        const projectIds = [...new Set(staleLeads.map(l => l.project_id))];
        const projectsWithStale = projects.filter(p => projectIds.includes(p.id));

        projectsWithStale.forEach(project => {
          const count = staleLeads.filter(l => l.project_id === project.id).length;
          alertsList.push({
            id: `stale-leads-${project.id}`,
            type: 'stale_leads',
            severity: 'warning',
            title: `${project.nombre}: seguimiento pendiente`,
            description: `${count} lead${count > 1 ? 's' : ''} con fecha de acción vencida`,
            icon: Calendar,
          });
        });
      }

      // 3. Check monthly goals at risk (< 80% progress at mid-month)
      if (isFirstHalf) {
        const expectedProgress = (dayOfMonth / 30) * 100; // Expected % for this day
        const minAcceptable = expectedProgress * 0.8; // 80% of expected

        // Get target values
        const obvTarget = objectives.find(o => o.name === 'obvs')?.target_value || 150;
        const teamObvTarget = obvTarget * 9;

        const totalOBVs = memberStats.reduce((sum, m) => sum + (Number(m.obvs) || 0), 0);
        const currentProgress = (totalOBVs / teamObvTarget) * 100;

        if (currentProgress < minAcceptable) {
          alertsList.push({
            id: 'goal-at-risk-obvs',
            type: 'goal_at_risk',
            severity: 'error',
            title: 'Meta de OBVs en riesgo',
            description: `${currentProgress.toFixed(0)}% de progreso vs ${expectedProgress.toFixed(0)}% esperado`,
            icon: TrendingDown,
          });
        }
      }

      return alertsList.slice(0, 5);
    },
    enabled: profiles.length > 0 && projects.length > 0,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <AlertTriangle size={18} className="text-warning" />
          <h3 className="font-semibold">Alertas</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <AlertTriangle size={18} className="text-success" />
          <h3 className="font-semibold">Alertas</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <span className="text-2xl mb-2 block">✅</span>
          <p className="text-sm">Todo en orden, ¡sigue así!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={18} className="text-warning" />
          <h3 className="font-semibold">Alertas</h3>
        </div>
        <span className="text-xs font-bold bg-warning/20 text-warning px-2.5 py-1 rounded-lg">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div 
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                alert.severity === 'error' ? "bg-destructive/10" : "bg-warning/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                alert.severity === 'error' ? "bg-destructive/20" : "bg-warning/20"
              )}>
                <Icon size={14} className={
                  alert.severity === 'error' ? "text-destructive" : "text-warning"
                } />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
