/**
 * IntegrationRecommendationCard — I15.71
 *
 * Card de recomendación contextual para una integración específica.
 * Muestra: título, reason (mensaje de Optimus — I15.72 + I15.76), impact concreto, CTA.
 *
 * I15.74 — aceptación: el callback onAccept es el punto de medición.
 * El padre puede loguear el evento a activity_log cuando el usuario hace click en el CTA.
 */

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, CreditCard, FileText, LayoutGrid, MessageSquare, BookOpen } from 'lucide-react'
import type { IntegrationRecommendation } from '@/lib/integration-recommendations'

import { useTranslation } from 'react-i18next';
const PROVIDER_ICON: Record<string, ReactNode> = {
  stripe: <CreditCard className="w-5 h-5 text-indigo-500" />,
  holded: <FileText className="w-5 h-5 text-cyan-500" />,
  trello: <LayoutGrid className="w-5 h-5 text-sky-500" />,
  slack: <MessageSquare className="w-5 h-5 text-violet-500" />,
  notion: <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
}

const PROVIDER_COLOR: Record<string, string> = {
  stripe: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20',
  holded: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
  trello: 'from-sky-500/10 to-blue-500/10 border-sky-500/20',
  slack: 'from-violet-500/10 to-purple-500/10 border-violet-500/20',
  notion: 'from-gray-500/10 to-slate-500/10 border-gray-500/20',
}

interface IntegrationRecommendationCardProps {
  recommendation: IntegrationRecommendation
  /** I15.74 — llamado cuando usuario hace click en CTA */
  onAccept: () => void
}

export function IntegrationRecommendationCard({
  recommendation,
  onAccept,
}: IntegrationRecommendationCardProps) {
  const { t } = useTranslation();
  const { provider, title, reason, impact, cta } = recommendation
  const icon = PROVIDER_ICON[provider]
  const colorClass = PROVIDER_COLOR[provider] ?? 'from-primary/10 to-primary/5 border-primary/20'

  return (
    <Card className={`bg-gradient-to-br ${colorClass}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">{icon}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{title}</p>
              <Badge variant="secondary" className="text-xs h-5 px-1.5 gap-1">
                <Sparkles size={10} />{t('integrations.optimus')}</Badge>
            </div>
            {/* I15.72 — reason: dato que entra / módulo / efecto */}
            <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
          </div>
        </div>

        {/* Impact */}
        <div className="ml-8 p-2 rounded-md bg-background/60 border border-border/40">
          <p className="text-xs text-foreground/80">
            <span className="font-medium">Efecto: </span>
            {impact}
          </p>
        </div>

        {/* CTA — I15.74 */}
        <div className="ml-8">
          <Button size="sm" variant="default" onClick={onAccept} className="gap-1.5 h-7 text-xs">
            {cta}
            <ArrowRight size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
