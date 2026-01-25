import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useNovaData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface PendingItem {
  id: string;
  type: 'obv' | 'bp' | 'lp' | 'cp';
  titulo: string;
  owner_id: string;
  owner_nombre: string;
  owner_color: string;
  project_nombre?: string;
  created_at: string;
}

export function PendingValidationsWidget() {
  const { profile } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const queryClient = useQueryClient();

  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ['pending_validations_dashboard', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Fetch pending OBVs
      const { data: obvs } = await supabase
        .from('obvs_public')
        .select('id, titulo, tipo, owner_id, project_id, created_at')
        .eq('status', 'pending')
        .neq('owner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch pending KPIs
      const { data: kpis } = await supabase
        .from('kpis')
        .select('id, titulo, type, owner_id, created_at')
        .eq('status', 'pending')
        .neq('owner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get already validated items by current user
      const obvIds = obvs?.map(o => o.id) || [];
      const kpiIds = kpis?.map(k => k.id) || [];

      const [obvVotes, kpiVotes] = await Promise.all([
        obvIds.length > 0 
          ? supabase.from('obv_validaciones').select('obv_id').eq('validator_id', profile.id).in('obv_id', obvIds)
          : { data: [] },
        kpiIds.length > 0
          ? supabase.from('kpi_validaciones').select('kpi_id').eq('validator_id', profile.id).in('kpi_id', kpiIds)
          : { data: [] },
      ]);

      const votedObvIds = new Set(obvVotes.data?.map(v => v.obv_id) || []);
      const votedKpiIds = new Set(kpiVotes.data?.map(v => v.kpi_id) || []);

      // Get projects for OBVs
      const projectIds = [...new Set(obvs?.map(o => o.project_id).filter(Boolean) || [])] as string[];
      const { data: projects } = projectIds.length > 0
        ? await supabase.from('projects').select('id, nombre').in('id', projectIds)
        : { data: [] };
      const projectsMap = new Map<string, string>();
      projects?.forEach(p => projectsMap.set(p.id, p.nombre));

      // Build unified list
      const items: PendingItem[] = [];

      // Add OBVs
      obvs?.filter(o => !votedObvIds.has(o.id)).forEach(obv => {
        const owner = profiles.find(p => p.id === obv.owner_id);
        items.push({
          id: obv.id,
          type: 'obv' as const,
          titulo: obv.titulo,
          owner_id: obv.owner_id,
          owner_nombre: owner?.nombre || 'Desconocido',
          owner_color: owner?.color || '#6366F1',
          project_nombre: obv.project_id ? projectsMap.get(obv.project_id) : undefined,
          created_at: obv.created_at || '',
        });
      });

      // Add KPIs
      kpis?.filter(k => !votedKpiIds.has(k.id)).forEach(kpi => {
        const owner = profiles.find(p => p.id === kpi.owner_id);
        items.push({
          id: kpi.id,
          type: kpi.type as 'bp' | 'lp' | 'cp',
          titulo: kpi.titulo,
          owner_id: kpi.owner_id,
          owner_nombre: owner?.nombre || 'Desconocido',
          owner_color: owner?.color || '#6366F1',
          created_at: kpi.created_at || '',
        });
      });

      // Sort by created_at
      return items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
    },
    enabled: !!profile?.id && profiles.length > 0,
  });

  const handleQuickValidate = async (item: PendingItem, approved: boolean) => {
    if (!profile?.id) return;

    try {
      if (item.type === 'obv') {
        const { error } = await supabase.from('obv_validaciones').insert({
          obv_id: item.id,
          validator_id: profile.id,
          approved,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kpi_validaciones').insert({
          kpi_id: item.id,
          validator_id: profile.id,
          approved,
        });
        if (error) throw error;
      }

      toast.success(approved ? 'Aprobado' : 'Rechazado');
      queryClient.invalidateQueries({ queryKey: ['pending_validations_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending_obvs_for_validation'] });
      queryClient.invalidateQueries({ queryKey: ['pending_kpis'] });
    } catch (error) {
      console.error('Error validating:', error);
      toast.error('Error al validar');
    }
  };

  const totalPending = pendingItems.length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-success" />
          Validaciones Pendientes
        </h3>
        {totalPending > 0 && (
          <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-lg">
            {totalPending}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">¡Todo validado!</p>
          </div>
        ) : (
          pendingItems.map((item) => (
            <div 
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-background"
            >
              {/* Type Badge */}
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase shrink-0",
                item.type === 'obv' && "bg-gradient-to-br from-primary to-purple-500",
                item.type === 'bp' && "bg-gradient-to-br from-success to-emerald-600",
                item.type === 'lp' && "bg-gradient-to-br from-warning to-amber-600",
                item.type === 'cp' && "bg-gradient-to-br from-pink-500 to-rose-600"
              )}>
                {item.type}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {item.owner_nombre}
                  {item.project_nombre && ` • ${item.project_nombre}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleQuickValidate(item, true)}
                  className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center text-success hover:bg-success hover:text-success-foreground transition-colors"
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={() => handleQuickValidate(item, false)}
                  className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
