import { CheckCircle2, Circle, FileCheck } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';
import { deriveRegression } from './RegressionBanner';
import { EngineEmptyState } from './EngineEmptyState';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
interface PhaseProgressBarProps {
  engineData: ProjectEngineData | null | undefined;
  onCTA?: () => void;
}

function barColor(status: string): string {
  switch (status) {
    case 'healthy':  return 'bg-success';
    case 'critical': return 'bg-destructive';
    default:         return 'bg-warning';   // friction
  }
}

export function PhaseProgressBar({ engineData, onCTA }: PhaseProgressBarProps) {
  const { t } = useTranslation();
  // Sin fila de phase_state → motor sin datos aún
  if (!engineData?.phaseState) {
    return (
      <EngineEmptyState
        icon={FileCheck}
        title={t('project.elMotorAúnNo')}
        description={t('project.elSistemaNecesitaEvidencia')}
        cta={onCTA ? { label: 'Crear primer OBV', onClick: onCTA } : undefined}
      />
    );
  }

  const phase      = engineData.phaseState.current_phase;
  const score      = Math.round(engineData.phaseState.phase_score);
  const status     = engineData.phaseState.phase_status;
  const hardSignal = engineData.phaseState.hard_signal_met;

  // Nivel 1 — señal de regresión compacta en la barra
  const regression = deriveRegression(engineData?.phaseHistory ?? []);

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex justify-end mb-2"><SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.6} size="sm" /></div>
      {/* Etiqueta */}
      <div className="shrink-0 w-40">
        <p className="text-sm font-semibold leading-none">Fase {phase}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {PHASE_LABELS[phase] ?? `Fase ${phase}`}
        </p>
      </div>

      {/* Barra */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(status)}`}
          style={{ width: `${Math.max(2, score)}%` }}
        />
      </div>

      {/* Score + señal de regresión Nivel 1 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums w-9 text-right">
          {score}%
        </span>
        {regression && (
          <span className="text-[11px] tabular-nums text-destructive font-medium">
            {regression.type === 'phase_drop'
              ? `↓ F${regression.fromPhase}→F${regression.toPhase}`
              : `↓ ${Math.abs(regression.scoreDelta)} pts`
            }
          </span>
        )}
      </div>

      {/* Señal dura */}
      <div className={`flex items-center gap-1.5 shrink-0 text-xs font-medium ${
        hardSignal ? 'text-success' : 'text-muted-foreground'
      }`}>
        {hardSignal
          ? <><CheckCircle2 className="h-3.5 w-3.5" />{t('project.señalDuraCumplida')}</>
          : <><Circle      className="h-3.5 w-3.5" />{t('project.faltaSeñalDura')}</>
        }
      </div>
    </div>
  );
}
