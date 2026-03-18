/**
 * IntegrationRecommendationsPanel — I15.67 + I15.68 + I15.71
 *
 * Panel de recomendaciones contextuales. Renderiza:
 * - Si fase < 2 (I15.68): aviso "integraciones financieras se activan en fase 2"
 * - Si fase ≥ 2 y hay recomendaciones: hasta 2 cards (I15.73)
 * - Si todas las integraciones relevantes ya están conectadas: nada (null)
 *
 * Props ligeras: el panel recibe los datos ya resueltos por el padre,
 * no hace fetch propio.
 */

import {
  getIntegrationRecommendations,
  isEarlyPhase,
  type IntegrationRecommendationContext,
} from '@/lib/integration-recommendations'
import { IntegrationRecommendationCard } from './IntegrationRecommendationCard'
import { Lock } from 'lucide-react'

interface IntegrationRecommendationsPanelProps {
  ctx: IntegrationRecommendationContext
  /** I15.74 — callback para navegar al tab del proveedor seleccionado */
  onNavigate: (tab: string) => void
}

export function IntegrationRecommendationsPanel({
  ctx,
  onNavigate,
}: IntegrationRecommendationsPanelProps) {
  // I15.68 — fase temprana: aviso contextual, no recomendaciones
  if (isEarlyPhase(ctx.current_phase)) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-4 flex items-start gap-3 bg-muted/30">
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Lock size={14} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Integraciones financieras — disponibles en Fase 2</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stripe y Holded se activan cuando tu proyecto entra en tracción (Fase 2).
            Ahora mismo no tienen datos que importar — esperan a que tengas MRR o facturas reales.
          </p>
        </div>
      </div>
    )
  }

  const recommendations = getIntegrationRecommendations(ctx)

  // Todas conectadas — nada que recomendar
  if (recommendations.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">Recomendado para tu proyecto</p>
        <span className="text-xs text-muted-foreground">
          ({recommendations.length} integración{recommendations.length > 1 ? 'es' : ''})
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((rec) => (
          <IntegrationRecommendationCard
            key={rec.provider}
            recommendation={rec}
            onAccept={() => onNavigate(rec.targetTab)}  // I15.74
          />
        ))}
      </div>
    </div>
  )
}
