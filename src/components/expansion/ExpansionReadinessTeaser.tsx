/**
 * F22.2 — ExpansionReadinessTeaser
 *
 * Muestra estado de cada condición con checkmark/pendiente.
 * Si no ready: horizonte motivacional.
 * Si ready: CTA t('expansion.analizarMisMercadosIdeales0').
 */

import { CheckCircle2, Circle, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpansionReadiness } from '@/hooks/useExpansionReadiness';

import { useTranslation } from 'react-i18next';
interface ExpansionReadinessTeaserProps {
  projectId: string;
  onAnalyze?: () => void;
}

function ConditionRow({ met, label }: { met: boolean | 'stale'; label: string }) {
  const { t } = useTranslation();
  const icon = met === true
    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;

  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className={met === true ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
        {met === 'stale' && <span className="text-xs ml-1">(datos insuficientes)</span>}
      </span>
    </div>
  );
}

export function ExpansionReadinessTeaser({ projectId, onAnalyze }: ExpansionReadinessTeaserProps) {
  const { data: readiness, isLoading } = useExpansionReadiness(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!readiness) return null;

  const { conditions, readinessScore, readinessLabel, isReady } = readiness;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isReady ? 'bg-green-100' : 'bg-muted'
        }`}>
          <Globe className={`h-5 w-5 ${isReady ? 'text-green-600' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t('expansion.expansionIntelligence')}</h3>
          <p className="text-xs text-muted-foreground">{readinessLabel}</p>
        </div>
        <div className="ml-auto text-lg font-bold tabular-nums">
          {readinessScore}%
        </div>
      </div>

      {/* Conditions checklist */}
      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
        <ConditionRow met={conditions.phaseOk} label={t('expansion.fase3OSuperior')} />
        <ConditionRow met={conditions.mrrTrendOk} label="MRR estable o creciente (60 días)" />
        <ConditionRow met={conditions.riskOk} label={t('expansion.riesgoNoCrítico')} />
        <ConditionRow met={conditions.integrationOk} label={t('expansion.alMenos1Integración')} />
      </div>

      {/* CTA or motivational text */}
      {isReady ? (
        <Button className="w-full gap-2" onClick={onAnalyze}>
          <Globe className="h-4 w-4" />{t('expansion.analizarMisMercadosIdeales')}</Button>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Cuando alcances las 4 condiciones, Optimus te mostrará los 3 mejores mercados para tu negocio
          con un plan de exploración de 5 días.
        </p>
      )}
    </div>
  );
}
