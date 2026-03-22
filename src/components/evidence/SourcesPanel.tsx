/**
 * SourcesPanel — T17.19
 *
 * Panel colapsable de procedencia de un insight.
 * Trigger: botón t('evidence.verFuentes') discreto bajo el insight card.
 * No es un modal — se expande en línea sin re-render del card padre.
 *
 * Props:
 *   sources_used      — fuentes que contribuyeron al insight
 *   sources_discarded — fuentes descartadas (con razón)
 *   evidence_type     — tipo de evidencia del insight
 *   generated_at      — ISO timestamp de generación
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/i18n'
import { EvidenceBadge } from './EvidenceBadge'
import type { SourceUsed, SourceDiscarded, EvidenceType, ProviderSlug } from '@/lib/evidence'
import { trackEvidenceInspected } from '@/lib/analytics'

import { useTranslation } from 'react-i18next';
const PROVIDER_LABELS: Record<string, string> = {
  stripe:          t('evidence.stripe'),
  hubspot:         t('evidence.hubspot'),
  asana:           t('evidence.asana'),
  google_calendar: t('evidence.googleCalendar'),
  holded:          t('evidence.holded'),
  user_manual:     t('evidence.inputManual'),
  ai_inferred:     t('evidence.iaInferido'),
}

interface SourcesPanelProps {
  sources_used:      SourceUsed[]
  sources_discarded: SourceDiscarded[]
  evidence_type:     EvidenceType
  generated_at:      string
  /** T17.32 — opcionales para tracking PostHog */
  project_id?:       string
  insight_type?:     string
}

export function SourcesPanel({
  sources_used,
  sources_discarded,
  evidence_type,
  generated_at,
  project_id,
  insight_type,
}: SourcesPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false)

  // No renderizar si no hay información de fuentes
  if (sources_used.length === 0 && sources_discarded.length === 0) return null

  const recency = formatDistanceToNow(new Date(generated_at), { addSuffix: true, locale: getDateFnsLocale() })

  function handleToggle() {
    const next = !open
    setOpen(next)
    // T17.32 — disparar evento solo al abrir (no al cerrar)
    if (next && project_id && insight_type) {
      trackEvidenceInspected({ project_id, insight_type, evidence_type })
    }
  }

  return (
    <div className="mt-1.5">
      {/* Trigger */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        aria-expanded={open}
      >
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        Ver fuentes
      </button>

      {/* Panel expandido */}
      {open && (
        <div className="mt-2 space-y-3 rounded-lg bg-muted/30 border border-border/40 p-3 text-xs">

          {/* Fuentes usadas */}
          {sources_used.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground font-medium">{t('evidence.fuentesUsadas')}</p>
              {sources_used.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-foreground/80">
                    {PROVIDER_LABELS[s.source] ?? s.source}
                  </span>
                  {/* Barra de confianza */}
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.round(s.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-muted-foreground shrink-0">
                    {Math.round(s.confidence * 100)}% conf.
                  </span>
                  <span className="text-muted-foreground/60 shrink-0">
                    · {s.entity_count} entidad{s.entity_count !== 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Fuentes descartadas */}
          {sources_discarded.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground font-medium">{t('evidence.fuentesDescartadas')}</p>
              {sources_discarded.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 text-muted-foreground/70">
                  <span className="shrink-0">└──</span>
                  <span>
                    {PROVIDER_LABELS[s.source] ?? s.source}
                    {' '}descartado · {s.reason.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tipo de dato + recencia */}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Tipo:</span>
              <EvidenceBadge
                type={evidence_type}
                source={sources_used[0]?.source as ProviderSlug | undefined}
              />
            </div>
            <span className="text-muted-foreground/60">{recency}</span>
          </div>

        </div>
      )}
    </div>
  )
}
