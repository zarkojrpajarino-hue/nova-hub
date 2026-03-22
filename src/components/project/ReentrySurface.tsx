/**
 * REENTRY SURFACE — V11.0
 *
 * Capa de re-entry: muestra resumen de ausencia antes de la superficie activa.
 * Activa cuando last_seen_at > 7 días (threshold v1).
 *
 * No es una 5ª superficie — es una capa previa que se consume con el CTA.
 * Después del acknowledge → proyecta la superficie activa normal
 * (reset > weekly > engine, ya computada en useActiveSurface).
 *
 * Especificación: SURFACES_V1.md §Re-entry navigation order
 */

import { Loader2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/shared/SourceBadge';
import {
  useProjectEngineData,
  useProjectViabilityState,
  useStrategicCyclesWhileAway,
} from '@/hooks/useNovaDataOptimized';
import { getNextAction } from '@/lib/next-action';
import { NextActionFocusBlock } from '@/components/project/NextActionFocusBlock';
import { useTranslation } from 'react-i18next';
import { SourceBadge } from '@/components/shared/SourceBadge';
import {
  computeReentryPayload,
  PHASE_LABEL,
  VIABILITY_LABEL,
  TREND_LABEL,
  BLOCK_LABEL,
  CHANGE_LABELS,
  CHANGE_PRIORITY,
  type UrgencySeverity,
} from '@/lib/reentry';

interface ReentrySurfaceProps {
  projectId: string;
  lastSeenAt: string;
  onAcknowledge: () => void;
  /** DEUDA.PE.7: callback opcional para navegar a un tab específico tras acknowledge */
  onNavigateToTab?: (tab: string) => void;
}

const SEVERITY_BADGE: Record<UrgencySeverity, string> = {
  critical: 'bg-destructive/20 text-destructive',
  high:     'bg-orange-500/20 text-orange-500',
  medium:   'bg-yellow-500/20 text-yellow-500',
};

const SEVERITY_LABEL: Record<UrgencySeverity, string> = {
  critical: 'CRÍTICO',
  high:     'ALTO',
  medium:   'MEDIO',
};

export function ReentrySurface({ projectId, lastSeenAt, onAcknowledge, onNavigateToTab }: ReentrySurfaceProps) {
  const { t } = useTranslation();
  const { data: engineData, isLoading: engineLoading } = useProjectEngineData(projectId);
  const { data: viabilityData, isLoading: viabilityLoading } = useProjectViabilityState(projectId);
  const { data: cycleData, isLoading: cycleLoading } = useStrategicCyclesWhileAway(projectId, lastSeenAt);

  const isLoading = engineLoading || viabilityLoading || cycleLoading;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: engine data may be null for brand-new projects without engine run yet
  if (!engineData) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock size={14} />
          <span>{t('project.resumenDeReentry')}</span>
        </div>
        <p className="text-muted-foreground">{t('project.elMotorDelProyecto')}</p>
        <Button onClick={onAcknowledge} className="gap-2">{t('project.verEstadoActual')}<ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  const nextAction     = getNextAction(engineData);
  const viabilityStatus = viabilityData?.viability_status ?? 'healthy';

  const payload = computeReentryPayload({
    lastSeenAt,
    engineData,
    viabilityStatus,
    cycleClosedWhileAway: cycleData?.cycleClosedWhileAway ?? false,
    ritualMissed:         cycleData?.ritualMissed         ?? false,
    nextActionTitle:      nextAction?.title               ?? null,
    nextActionDescription: nextAction?.description        ?? null,
  });

  const { absenceDays, triggerReason, currentState, changes, urgencies, resume } = payload;

  // Cambios detectados: filtrar los true en orden de prioridad, max 4
  const activeChanges = CHANGE_PRIORITY.filter(key => changes[key] === true).slice(0, 4);

  const dayLabel = absenceDays === 1 ? 'día' : 'días';

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">

      {/* ── U6.V2.1: Focus Block — primera acción concreta al volver ──────── */}
      {/* DEUDA.PE.7: si hay onNavigateToTab, acknowledge + navegar al tab correcto */}
      <NextActionFocusBlock
        projectId={projectId}
        onNavigateToTab={(tab) => {
          onAcknowledge();
          onNavigateToTab?.(tab);
        }}
      />

      {/* ── Banner 60 días (EC13.8) ────────────────────────────────────────── */}
      {triggerReason === 'inactive_60d' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">{t('project.riesgoDeAbandono')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los proyectos sin actividad durante más de 60 días tienen una tasa de recuperación muy baja.
              Vale la pena evaluar si este proyecto sigue siendo prioritario.
            </p>
          </div>
        <SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.5} size="sm" />
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock size={14} />
          <span>Has estado fuera {absenceDays} {dayLabel}</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight">{resume.headline}</h2>
      </div>

      {/* ── Resumen ───────────────────────────────────────────────────────── */}
      <p className="text-muted-foreground leading-relaxed">{resume.summary}</p>

      {/* ── Estado actual ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('project.estadoActual')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{t('project.fase')}</p>
            <p className="font-medium text-sm">
              {PHASE_LABEL[currentState.phase] ?? `Fase ${currentState.phase}`}
            </p>
          </div>
          <div className="bg-background rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{t('project.viabilidad')}</p>
            <p className="font-medium text-sm">
              {VIABILITY_LABEL[currentState.viabilityStatus] ?? currentState.viabilityStatus}
            </p>
          </div>
          <div className="bg-background rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{t('project.probabilidad')}</p>
            <p className="font-medium text-sm">
              {TREND_LABEL[currentState.probabilityTrend]}
            </p>
          </div>
          {currentState.primaryBlock !== 'none' && (
            <div className="bg-background rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{t('project.bloqueo')}</p>
              <p className="font-medium text-sm">
                {BLOCK_LABEL[currentState.primaryBlock]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Cambios detectados ────────────────────────────────────────────── */}
      {activeChanges.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('project.cambiosDetectados')}</h3>
          <div className="space-y-2">
            {activeChanges.map(key => (
              <div
                key={key}
                className="flex items-center gap-3 py-2.5 px-4 bg-card border border-border rounded-xl"
              >
                <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                <span className="text-sm">{CHANGE_LABELS[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Urgencias activas ─────────────────────────────────────────────── */}
      {urgencies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('project.urgenciasActivas')}</h3>
          <div className="space-y-2">
            {urgencies.map((u, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 px-4 bg-card border border-border rounded-xl"
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${SEVERITY_BADGE[u.severity]}`}
                >
                  {SEVERITY_LABEL[u.severity]}
                </span>
                <span className="text-sm">{u.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        {resume.signalBasis && (
          <p className="text-sm text-muted-foreground">{resume.signalBasis}</p>
        )}
        {nextAction && (
          <p className="text-sm">
            <span className="text-muted-foreground">Próximo paso: </span>
            <span className="font-medium">{nextAction.title}</span>
          </p>
        )}
        <Button onClick={onAcknowledge} className="gap-2">
          {nextAction ? 'Retomar proyecto': t('project.verEstadoActual0')}
          <ArrowRight size={16} />
        </Button>
      </div>

    </div>
  );
}
