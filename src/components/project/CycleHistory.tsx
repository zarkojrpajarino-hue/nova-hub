/**
 * CE25.10 — Historial de ciclos completados
 *
 * Lista de ciclos pasados con scores, duración, status.
 * Se integra en CycleDashboard como sección colapsable.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import { useCycleHistory, type StrategicCycle } from '@/hooks/useStrategicCycles';

import { useTranslation } from 'react-i18next';
interface CycleHistoryProps {
  projectId: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string; color: string }> = {
  completed:  { icon: CheckCircle2, label: t('project.completado'), color: 'text-green-500' },
  revised:    { icon: PauseCircle,  label: t('project.revisado'),   color: 'text-blue-500' },
  abandoned:  { icon: XCircle,      label: t('project.abandonado'), color: 'text-red-500' },
  paused:     { icon: PauseCircle,  label: t('project.pausado'),    color: 'text-orange-500' },
};

function CycleCard({ cycle }: { cycle: StrategicCycle }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[cycle.status] ?? STATUS_CONFIG.completed;
  const Icon = config.icon;
  const score = Math.round(cycle.cycle_score);

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {cycle.title || `Ciclo ${cycle.cycle_index}`}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {cycle.start_date} → {cycle.end_date} · {config.label}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums shrink-0">{score}%</span>
    </div>
  );
}

export function CycleHistory({ projectId }: CycleHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: cycles, isLoading } = useCycleHistory(projectId);

  if (isLoading || !cycles || cycles.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {cycles.length} ciclo{cycles.length > 1 ? 's' : ''} anterior{cycles.length > 1 ? 'es' : ''}
      </button>

      {expanded && (
        <div className="mt-2 bg-muted/30 rounded-lg p-3">
          {cycles.map((c) => <CycleCard key={c.id} cycle={c} />)}
        </div>
      )}
    </div>
  );
}
