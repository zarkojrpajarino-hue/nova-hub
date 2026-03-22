import { Unlock, ArrowRight } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import type { NextAction } from '@/lib/next-action';
import { deriveCostOfIgnoring } from './CostOfIgnoring';
import { deriveRegression } from './RegressionBanner';

import { useTranslation } from 'react-i18next';
// ── Derivation ────────────────────────────────────────────────────────────────
// Activa cuando cualquiera de estas condiciones se cumple:
//   1. viability_status === 'critical'
//   2. risk_level === 'critical' (active)
//   3. regressionType === 'phase_drop'
//   4. nextAction bloqueante + costOfIgnoring.severity === 'high'

interface UnlockInfo {
  mainAction: string;
  consequences: string[];
  ctaActionType?: 'create_obv' | 'add_metrics' | 'define_channel';
}

// eslint-disable-next-line react-refresh/only-export-components
export function deriveUnlockMode(
  engineData: ProjectEngineData | null | undefined,
  nextAction: NextAction,
  viabilityStatus: string | undefined,
): UnlockInfo | null {
  if (!engineData) return null;

  const riskLevel  = engineData.risk?.risk_level  ?? 'low';
  const riskStatus = engineData.risk?.risk_status ?? 'insufficient_data';
  const regression = deriveRegression(engineData.phaseHistory ?? []);

  const isViabilityCritical = viabilityStatus === 'critical';
  const isRiskCritical      = riskStatus === 'active' && riskLevel === 'critical';
  const isPhaseDrop         = regression?.type === 'phase_drop';
  const cost                = deriveCostOfIgnoring(engineData, nextAction);
  const isHighCostAction    = cost?.severity === 'high';

  const isActive = isViabilityCritical || isRiskCritical || isPhaseDrop || isHighCostAction;
  if (!isActive) return null;

  // Si hay nextAction, úsala como palanca principal
  if (nextAction) {
    return {
      mainAction:    nextAction.title,
      consequences:  cost?.consequences ?? [t('project.puedeReducirseLaCapacidad')],
      ctaActionType: nextAction.actionType,
    };
  }

  // Sin nextAction — condición de viabilidad o riesgo puro
  if (isViabilityCritical) {
    return {
      mainAction:   t('project.revisaElEstadoDe'),
      consequences: [
        t('project.elEstadoActualBloquea'),
        t('project.actuarAhoraReduceEl'),
      ],
    };
  }

  if (isRiskCritical) {
    return {
      mainAction:   t('project.reduceElRiesgoCrítico'),
      consequences: [
        t('project.elRiesgoCríticoPuede'),
        t('project.elProyectoPuedeEntrar'),
      ],
    };
  }

  return {
    mainAction:   t('project.resuelveElBloqueoPrincipal'),
    consequences: [t('project.elProyectoNoPuede')],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UnlockModeCardProps {
  engineData: ProjectEngineData | null | undefined;
  nextAction: NextAction;
  viabilityStatus?: string;
  onCTA?: (actionType: 'create_obv' | 'add_metrics' | 'define_channel' | 'create_task' | 'open_meeting') => void;
}

export function UnlockModeCard({ engineData, nextAction, viabilityStatus, onCTA }: UnlockModeCardProps) {
  const { t } = useTranslation();
  const info = deriveUnlockMode(engineData, nextAction, viabilityStatus);
  if (!info) return null;

  return (
    <div className="border-t border-border pt-3">
      <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <Unlock className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-destructive">{t('project.modoDesbloqueo')}</span>
        </div>

        {/* Body */}
        <p className="text-xs text-muted-foreground leading-snug">{t('project.hayUnBloqueoQue')}</p>

        {/* Main action */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('project.empiezaPorEsto')}</p>
          <p className="text-xs font-medium leading-snug">{info.mainAction}</p>
        </div>

        {/* Consequences */}
        {info.consequences.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('project.porQuéImporta')}</p>
            {info.consequences.map((c, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                {c}
              </p>
            ))}
          </div>
        )}

        {/* CTA */}
        {info.ctaActionType && onCTA && (
          <button
            onClick={() => onCTA(info.ctaActionType!)}
            className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline pt-0.5"
          >{t('project.irAResolverlo')}<ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
