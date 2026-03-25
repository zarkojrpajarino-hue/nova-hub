import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
interface EngineIndicatorsProps {
  engineData: ProjectEngineData | null | undefined;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function phaseStatusDot(status: string): string {
  switch (status) {
    case 'healthy':  return 'bg-success';
    case 'critical': return 'bg-destructive';
    default:         return 'bg-warning';   // friction
  }
}

function probDotColor(status: string, score: number | null): string {
  if (status !== 'active') return 'bg-warning';
  const s = score ?? 0;
  if (s > 60) return 'bg-success';
  if (s > 30) return 'bg-warning';
  return 'bg-destructive';
}

function riskDotColor(status: string, level: string): string {
  if (status !== 'active') return 'bg-muted-foreground/30';
  switch (level) {
    case 'low':      return 'bg-success';
    case 'medium':   return 'bg-warning';
    case 'high':
    case 'critical': return 'bg-destructive';
    default:         return 'bg-muted-foreground/30';
  }
}

function riskLabel(status: string, level: string): string {
  if (status !== 'active') return '—';
  const MAP: Record<string, string> = { low: t('project.bajo'), medium: t('project.medio'), high: t('project.alto'), critical: t('project.crítico') };
  return MAP[level] ?? '—';
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EngineIndicators({ engineData }: EngineIndicatorsProps) {
  const { t } = useTranslation();
  // Phase
  const phase       = engineData?.phaseState?.current_phase ?? 1;
  const phaseScore  = Math.round(engineData?.phaseState?.phase_score ?? 0);
  const phaseStatus = engineData?.phaseState?.phase_status  ?? 'friction';

  // Probability — EC13.7: número sólo visible cuando el motor está activo
  const probStatus  = engineData?.probability?.probability_status ?? 'inactive';
  const probScore   = engineData?.probability?.probability_score  ?? null;
  const probActive  = probStatus === 'active';
  const filledDots  = probActive ? Math.min(5, Math.round((probScore ?? 0) / 20)) : 0;
  const dotColor    = probDotColor(probStatus, probScore);

  // Risk
  const riskStatus = engineData?.risk?.risk_status ?? 'insufficient_data';
  const riskLevel  = engineData?.risk?.risk_level  ?? 'low';

  return (
    <div className="flex items-center gap-5">
      <div className="flex justify-end mb-2"><SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.5} size="sm" /></div>

      {/* Fase */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${phaseStatusDot(phaseStatus)}`} />
        <div>
          <p className="text-base font-bold leading-none">Fase {phase}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{phaseScore}%</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Probabilidad — dots dominan, número secundario */}
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                i < filledDots ? dotColor : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-sm font-semibold ml-1.5 leading-none">
            {probActive && probScore != null ? Math.round(probScore) : '—'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">{t('project.probabilidad')}</p>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Riesgo — dot + etiqueta corta */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${riskDotColor(riskStatus, riskLevel)}`} />
        <div>
          <p className="text-base font-bold leading-none">{riskLabel(riskStatus, riskLevel)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('project.riesgo')}</p>
        </div>
      </div>

    </div>
  );
}
