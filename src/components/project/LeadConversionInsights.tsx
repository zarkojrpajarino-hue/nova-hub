/**
 * D5.1 — LeadConversionInsights
 *
 * Explota obv_pipeline_history para mostrar velocidad de conversión por etapa.
 * "frio→tibio en <7d = alta conversión" vs ">14d = baja conversión"
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Clock } from 'lucide-react';

import { useTranslation } from 'react-i18next';
interface StageTransition {
  from_status: string;
  to_status: string;
  avg_days: number;
  count: number;
}

export function LeadConversionInsights({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data: transitions } = useQuery({
    queryKey: ['lead-conversion', projectId],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<StageTransition[]> => {
      // Get pipeline transitions with time between stages
      const { data, error } = await supabase
        .from('obv_pipeline_history')
        .select('id, obv_id, old_status, new_status, created_at, obvs!inner(project_id)')
        .eq('obvs.project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data || data.length === 0) return [];

      // Group by transition type and calculate avg days
      const groups: Record<string, { totalDays: number; count: number }> = {};

      for (let i = 0; i < data.length; i++) {
        const curr = data[i];
        const key = `${curr.old_status}→${curr.new_status}`;
        if (!groups[key]) groups[key] = { totalDays: 0, count: 0 };

        // Find previous transition for same obv to calculate days between
        const prev = data.find(
          (d, j) => j > i && d.obv_id === curr.obv_id && d.new_status === curr.old_status
        );
        if (prev) {
          const days = (new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) / 86_400_000;
          groups[key].totalDays += days;
          groups[key].count++;
        } else {
          groups[key].count++;
        }
      }

      return Object.entries(groups)
        .map(([key, val]) => {
          const [from_status, to_status] = key.split('→');
          return {
            from_status,
            to_status,
            avg_days: val.count > 0 ? Math.round(val.totalDays / val.count) : 0,
            count: val.count,
          };
        })
        .filter(t => t.count >= 2) // Solo mostrar transiciones con ≥2 datos
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: !!projectId,
  });

  if (!transitions || transitions.length === 0) return null;

  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-semibold">{t('project.velocidadDeConversión')}</span>
      </div>
      <div className="space-y-1.5">
        {transitions.map((t) => {
          const speed = t.avg_days <= 7 ? 'text-green-600' : t.avg_days <= 14 ? 'text-amber-600' : 'text-red-500';
          return (
            <div key={`${t.from_status}→${t.to_status}`} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t.from_status} → {t.to_status}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.count}x</span>
                <span className={`flex items-center gap-0.5 font-medium ${speed}`}>
                  <Clock className="h-3 w-3" />
                  {t.avg_days > 0 ? `${t.avg_days}d` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Verde = rápido (&lt;7d) · Amarillo = medio (7-14d) · Rojo = lento (&gt;14d)
      </p>
    </div>
  );
}
