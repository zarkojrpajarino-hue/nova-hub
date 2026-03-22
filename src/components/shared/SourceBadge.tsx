/**
 * SourceBadge — INFRA.2
 *
 * Componente de transparencia unificado para FASE 17 / FASE 20 / FASE 21 / FASE 22.
 *
 * NO es `data-source-badge.tsx` (UI legacy, source: 'proyecto'|'crm'|...).
 * Este componente usa el sistema de evidencia de FASE 17:
 *   observed  = dato de integración activa (Stripe, HubSpot, GCal)
 *   declared  = input del founder (onboarding, Mi Modelo)
 *   estimated = cálculo del sistema sin fuente directa
 *   inferred  = inferencia IA sin datos suficientes
 */

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/i18n'

import { useTranslation } from 'react-i18next';
export type SourceType = 'observed' | 'declared' | 'estimated' | 'inferred'

export interface SourceBadgeProps {
  type: SourceType
  source?: string       // t('shared.stripe') | t('shared.hubspot') | "manual" | "sistema" | etc.
  reliability?: number  // 0-1 → muestra como % en tooltip
  timestamp?: string    // ISO string → "hace 3 días"
  label?: string        // override del texto del badge
  size?: 'sm' | 'default'
  className?: string
}

function getTypeConfig(t: (key: string) => string): Record<SourceType, { label: string; className: string; dot: string }> {
  return {
    observed:  { label: t('shared.observado'),  className: 'bg-green-100  text-green-800  border-green-200',  dot: 'bg-green-500'  },
    declared:  { label: t('shared.declarado'),  className: 'bg-blue-100   text-blue-800   border-blue-200',   dot: 'bg-blue-500'   },
    estimated: { label: t('shared.estimado'),   className: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
    inferred:  { label: t('shared.inferido'),   className: 'bg-gray-100   text-gray-700   border-gray-200',   dot: 'bg-gray-400'   },
  };
}

function buildTooltip(props: SourceBadgeProps): string | null {
  const lines: string[] = []

  if (props.source) lines.push(`Fuente: ${props.source}`)

  if (props.reliability !== undefined) {
    const pct = Math.round(props.reliability * 100)
    lines.push(`Fiabilidad: ${pct}%`)
  }

  if (props.timestamp) {
    try {
      const relative = formatDistanceToNow(new Date(props.timestamp), {
        addSuffix: true,
        locale: getDateFnsLocale(),
      })
      lines.push(`Actualizado ${relative}`)
    } catch {
      lines.push(`Actualizado: ${props.timestamp}`)
    }
  }

  return lines.length > 0 ? lines.join(' · ') : null
}

export function SourceBadge({
  type,
  source,
  reliability,
  timestamp,
  label,
  size = 'default',
  className,
}: SourceBadgeProps) {
  const { t } = useTranslation();
  const config = getTypeConfig(t)[type]
  const displayLabel = label ?? config.label
  const tooltip = buildTooltip({ type, source, reliability, timestamp })

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-normal border',
        config.className,
        size === 'sm' && 'text-xs py-0 px-1.5',
        tooltip && 'cursor-help',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      {displayLabel}
    </Badge>
  )

  if (!tooltip) return badge

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
