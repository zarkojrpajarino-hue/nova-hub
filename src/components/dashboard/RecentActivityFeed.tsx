import { useQuery } from '@tanstack/react-query';
import { Zap, FileCheck, CheckCircle2, Users, UserPlus, TrendingUp, Loader2 } from 'lucide-react';
import { useProfiles, useProjects } from '@/hooks/useNovaData';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityMetadata {
  titulo?: string;
  facturacion?: number;
  tipo?: string;
  type?: string;
  nombre?: string;
  proyecto_nombre?: string;
  [key: string]: unknown;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string | null;
  created_at: string | null;
  metadata: ActivityMetadata;
  user_nombre?: string;
  user_color?: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof FileCheck; color: string; label: string }> = {
  obv_created: { icon: FileCheck, color: '#6366F1', label: 'subió OBV' },
  obv_validated: { icon: CheckCircle2, color: '#22C55E', label: 'validó OBV' },
  kpi_created: { icon: TrendingUp, color: '#F59E0B', label: 'registró' },
  kpi_validated: { icon: CheckCircle2, color: '#22C55E', label: 'validó' },
  lead_created: { icon: UserPlus, color: '#3B82F6', label: 'añadió lead' },
  lead_updated: { icon: Users, color: '#A855F7', label: 'actualizó lead' },
  task_completed: { icon: CheckCircle2, color: '#22C55E', label: 'completó tarea' },
};

export function RecentActivityFeed() {
  const { data: profiles = [] } = useProfiles();
  useProjects(); // Keep for potential future use

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      // DISABLED: tabla activity_log no existe
      return [];
    },
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 1000 * 60, // 1 minuto
  });

  // Enrich activities with user info
  const enrichedActivities: ActivityItem[] = activities.map(activity => {
    const user = profiles.find(p => p.id === activity.user_id);
    const meta = typeof activity.metadata === 'object' && activity.metadata && !Array.isArray(activity.metadata)
      ? activity.metadata as ActivityMetadata
      : {};
    return {
      ...activity,
      metadata: meta,
      user_nombre: user?.nombre || 'Usuario',
      user_color: user?.color || '#6366F1',
    };
  });

  const formatActivityText = (activity: ActivityItem) => {
    const config = ACTION_CONFIG[activity.action] || { label: activity.action };
    const meta = activity.metadata;
    
    let target = '';
    let amount = '';
    
    if (activity.entity_type === 'obv') {
      target = meta.titulo || meta.tipo || 'OBV';
      if (meta.facturacion) amount = `€${meta.facturacion}`;
    } else if (activity.entity_type === 'kpi') {
      target = `${meta.type?.toUpperCase() || 'KPI'}: ${meta.titulo || ''}`;
    } else if (activity.entity_type === 'lead') {
      target = meta.nombre || 'lead';
      if (meta.proyecto_nombre) target += ` en ${meta.proyecto_nombre}`;
    } else if (activity.entity_type === 'task') {
      target = meta.titulo || 'tarea';
    }

    return { config, target, amount };
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <Zap size={18} className="text-warning" />
          <h3 className="font-semibold">Actividad Reciente</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border flex items-center gap-2.5">
        <Zap size={18} className="text-warning" />
        <h3 className="font-semibold">Actividad Reciente</h3>
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto">
        {enrichedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-1">
            {enrichedActivities.map((activity) => {
              const { config, target, amount } = formatActivityText(activity);
              const ActivityIcon = 'icon' in config ? config.icon : Zap;
              void ActivityIcon; // Used in render

              return (
                <div 
                  key={activity.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* User avatar */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: activity.user_color }}
                  >
                    {activity.user_nombre?.charAt(0) || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-semibold">{activity.user_nombre}</span>
                    <span className="text-muted-foreground"> {config.label} </span>
                    <span className="text-foreground font-medium truncate">{target}</span>
                    {amount && (
                      <span className="text-success font-bold ml-1">{amount}</span>
                    )}
                  </div>
                  
                  {activity.created_at && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
