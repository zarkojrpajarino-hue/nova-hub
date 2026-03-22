/**
 * D5.4 — DataCompletenessGuide
 *
 * Muestra qué datos faltan para mejorar el score de probabilidad.
 * "Para subir tu score necesitas: registrar costes (D2), añadir 3 OBVs (D1)"
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, Database } from 'lucide-react';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';

interface DataCompletenessGuideProps {
  projectId: string;
}

interface DataItem {
  label: string;
  met: boolean;
  impact: string;
}

function deriveDataItems(t: (key: string) => string, probability: {
  phase_score_input: number | null;
  execution_rate_input: number | null;
  validation_strength_input: number | null;
  revenue_momentum_input: number | null;
  capacity_health_input: number | null;
} | null): DataItem[] {
  if (!probability) return [];

  return [
    {
      label: t('dataGuide.phaseScore'),
      met: probability.phase_score_input !== null,
      impact: t('dataGuide.phaseScoreHint'),
    },
    {
      label: t('dataGuide.executionRate'),
      met: probability.execution_rate_input !== null,
      impact: t('dataGuide.executionRateHint'),
    },
    {
      label: t('dataGuide.validationStrength'),
      met: probability.validation_strength_input !== null,
      impact: t('dataGuide.validationStrengthHint'),
    },
    {
      label: t('dataGuide.revenueMomentum'),
      met: probability.revenue_momentum_input !== null,
      impact: t('dataGuide.revenueMomentumHint'),
    },
    {
      label: t('dataGuide.capacityHealth'),
      met: probability.capacity_health_input !== null,
      impact: t('dataGuide.capacityHealthHint'),
    },
  ];
}

export function DataCompletenessGuide({ projectId }: DataCompletenessGuideProps) {
  const { t } = useTranslation();
  const { data: engineData } = useProjectEngineData(projectId);
  const probability = engineData?.probability ?? null;

  if (!probability) return null;

  const items = deriveDataItems(t, probability);
  const completedCount = items.filter(i => i.met).length;

  if (completedCount === items.length) return null; // All complete — hide

  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-purple-500" />
        <span className="text-xs font-semibold">{t('dataGuide.title')}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{completedCount}/{items.length}</span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-xs">
            {item.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div>
              <span className={item.met ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {item.label}
              </span>
              {!item.met && (
                <p className="text-[10px] text-muted-foreground">{item.impact}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
