import { AlertTriangle } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import type { NextAction } from '@/lib/next-action';

import { useTranslation } from 'react-i18next';
// ── Types ─────────────────────────────────────────────────────────────────────

export type IgnoreSeverity = 'low' | 'medium' | 'high';

interface CostInfo {
  severity: IgnoreSeverity;
  consequences: string[];
}

// ── Derivation ────────────────────────────────────────────────────────────────
// Prioridad: riesgo activo alto/crítico → ops débiles fase 3 → create_obv → métricas → canal → genérico.
// Rescue Mode proxy: risk_status=active + risk_level=high|critical → eleva severidad a alto.
// Nota: viability_status=critical como fuente adicional de Rescue Mode no está disponible
// sin threading de viabilityData — mejora futura.

// eslint-disable-next-line react-refresh/only-export-components
export function deriveCostOfIgnoring(
  engineData: ProjectEngineData | null | undefined,
  nextAction: NextAction,
): CostInfo | null {
  if (!nextAction || !engineData) return null;

  const phase      = engineData.phaseState?.current_phase ?? 1;
  const riskLevel  = engineData.risk?.risk_level          ?? 'low';
  const riskStatus = engineData.risk?.risk_status         ?? 'insufficient_data';
  const type       = nextAction.actionType;

  const isActiveHighRisk = riskStatus === 'active' && (riskLevel === 'high' || riskLevel === 'critical');

  // 1. Riesgo activo alto/crítico — mayor prioridad
  if (isActiveHighRisk) {
    return {
      severity: 'high',
      consequences: [
        t('project.elRiesgoEstructuralPuede'),
        t('project.elProyectoPuedeEntrar'),
      ],
    };
  }

  // 2. create_obv en fase 3 → ops débiles
  if (type === 'create_obv' && phase === 3) {
    return {
      severity: 'high',
      consequences: [
        t('project.crecerásSobreUnaBase'),
        t('project.aumentaráElRiesgoDe'),
      ],
    };
  }

  // 3. create_obv en otras fases
  if (type === 'create_obv') {
    return {
      severity: 'high',
      consequences: [
        t('project.seguirásSinEvidenciaPara'),
        t('project.laProbabilidadSeMantendrá'),
      ],
    };
  }

  // 4. add_metrics
  if (type === 'add_metrics') {
    return {
      severity: 'medium',
      consequences: [
        t('project.elSistemaSeguiráOperando'),
        t('project.seráMásDifícilPriorizar'),
      ],
    };
  }

  // 5. define_channel
  if (type === 'define_channel') {
    return {
      severity: 'medium',
      consequences: [
        t('project.laAdquisiciónSeguiráSin'),
        t('project.elProyectoPuedeEstancarse'),
      ],
    };
  }

  // 6. nextAction sin actionType (recomendación solo textual)
  return {
    severity: 'medium',
    consequences: [t('project.puedeReducirseLaCapacidad')],
  };
}

// ── Config visual ─────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<IgnoreSeverity, {
  badgeClass: string;
  label: string;
}> = {
  low:    { badgeClass: 'text-muted-foreground bg-muted/40',           label: t('project.bajo')  },
  medium: { badgeClass: 'text-warning bg-warning/10',                  label: t('project.medio') },
  high:   { badgeClass: 'text-destructive bg-destructive/10',          label: t('project.alto')  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CostOfIgnoringProps {
  engineData: ProjectEngineData | null | undefined;
  nextAction: NextAction;
}

export function CostOfIgnoring({ engineData, nextAction }: CostOfIgnoringProps) {
  const { t } = useTranslation();
  const cost = deriveCostOfIgnoring(engineData, nextAction);
  if (!cost) return null;

  const cfg = SEVERITY_CONFIG[cost.severity];

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{t('project.costeDeIgnorarlo')}</span>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
      </div>
      <ul className="space-y-0.5 pl-1">
        {cost.consequences.map((c, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
