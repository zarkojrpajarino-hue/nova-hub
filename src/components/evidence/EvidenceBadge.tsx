/**
 * EvidenceBadge — T17.18
 *
 * Etiqueta visual compacta del tipo de dato (EvidenceType).
 * Muestra de dónde viene cada dato y qué tan directo es.
 *
 * Props:
 *   type     — EvidenceType del dato
 *   source   — ProviderSlug opcional (personaliza el tooltip de 'observed')
 *   compact  — solo punto de color sin texto (para espacios muy reducidos)
 */

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { EvidenceType, ProviderSlug } from '@/lib/evidence'

import { useTranslation } from 'react-i18next';

interface EvidenceConfig {
  dot:     string
  text:    string
  tooltip: string
}

function getProviderLabels(t: (k: string) => string): Record<ProviderSlug, string> {
  return {
    stripe:          t('evidence.stripe'),
    hubspot:         t('evidence.hubspot'),
    asana:           t('evidence.asana'),
    google_calendar: t('evidence.googleCalendar'),
    holded:          t('evidence.holded'),
    user_manual:     'el usuario',
    ai_inferred:     'el sistema',
  };
}

function getEvidenceConfig(t: (k: string) => string): Record<EvidenceType, EvidenceConfig> {
  return {
    observed:  { dot: 'bg-green-500', text: t('evidence.datoVerificado'), tooltip: 'Medido directamente por {source}' },
    declared:  { dot: 'bg-blue-500', text: t('evidence.datoDeclarado'), tooltip: t('evidence.introducidoManualmenteSinVerificación') },
    inferred:  { dot: 'bg-amber-500', text: t('evidence.inferido'), tooltip: t('evidence.calculadoPorElSistema') },
    estimated: { dot: 'bg-gray-400', text: t('evidence.estimado'), tooltip: t('evidence.aproximaciónSinDatoConcreto') },
  };
}

interface EvidenceBadgeProps {
  type:     EvidenceType
  source?:  ProviderSlug
  compact?: boolean
}

export function EvidenceBadge({ type, source, compact = false }: EvidenceBadgeProps) {
  const { t } = useTranslation();
  const EVIDENCE_CONFIG = getEvidenceConfig(t);
  const PROVIDER_LABELS = getProviderLabels(t);
  const cfg = EVIDENCE_CONFIG[type] ?? EVIDENCE_CONFIG.inferred

  const tooltipText = source && type === 'observed'
    ? cfg.tooltip.replace('{source}', PROVIDER_LABELS[source] ?? source)
    : cfg.tooltip.replace(' {source}', '')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1 cursor-default select-none"
          aria-label={cfg.text}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          {!compact && (
            <span className="text-xs text-muted-foreground">{cfg.text}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  )
}
