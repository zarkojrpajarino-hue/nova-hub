/**
 * PipelineVelocityCard — ER29.6
 *
 * Visual funnel showing each pipeline stage with average days.
 * Highlights bottleneck in red/amber.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePipelineVelocity, type PipelineTransition } from '@/hooks/usePipelineVelocity'
import { useFeatureUnlock } from '@/hooks/useUnlockProgress'
import { UnlockGate } from '@/components/project/UnlockProgress'
import { cn } from '@/lib/utils'

interface PipelineVelocityCardProps {
  projectId: string
}

const STATUS_LABELS: Record<string, string> = {
  frio: 'Frio',
  tibio: 'Tibio',
  hot: 'Hot',
  propuesta: 'Propuesta',
  negociacion: 'Negociacion',
  cerrado_ganado: 'Cerrado ganado',
  cerrado_perdido: 'Cerrado perdido',
}

function TransitionRow({
  transition,
  isBottleneck,
  maxDays,
}: {
  transition: PipelineTransition
  isBottleneck: boolean
  maxDays: number
}) {
  const { t } = useTranslation()
  const barWidth = maxDays > 0 ? (transition.avg_days / maxDays) * 100 : 0

  return (
    <div className={cn(
      'rounded-lg p-2.5 space-y-1.5',
      isBottleneck
        ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40'
        : 'bg-muted/50'
    )}>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium">
          {t(`pipelineVelocity.status_${transition.from}`, STATUS_LABELS[transition.from] || transition.from)}
        </span>
        <ArrowRight size={10} className="text-muted-foreground" />
        <span className="font-medium">
          {t(`pipelineVelocity.status_${transition.to}`, STATUS_LABELS[transition.to] || transition.to)}
        </span>
        <span className="ml-auto text-muted-foreground">
          {transition.count} {t('pipelineVelocity.transitions')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isBottleneck ? 'bg-red-500' : 'bg-primary'
            )}
            style={{ width: `${Math.max(barWidth, 5)}%` }}
          />
        </div>
        <span className={cn(
          'text-xs font-mono font-medium tabular-nums min-w-[3.5rem] text-right',
          isBottleneck ? 'text-red-600 dark:text-red-400' : 'text-foreground'
        )}>
          {transition.avg_days}d
        </span>
      </div>
      {isBottleneck && (
        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle size={10} />
          <span>{t('pipelineVelocity.bottleneck')}</span>
        </div>
      )}
    </div>
  )
}

export function PipelineVelocityCard({ projectId }: PipelineVelocityCardProps) {
  const { t } = useTranslation()
  const { data: featureUnlock } = useFeatureUnlock(projectId, 'pipeline_velocity')
  const { data: velocityData, isLoading } = usePipelineVelocity(projectId)

  const transitions = velocityData?.transitions ?? []
  const bottleneck = velocityData?.bottleneck
  const bottleneckKey = bottleneck && 'from' in bottleneck
    ? `${bottleneck.from}->${bottleneck.to}`
    : null
  const maxDays = transitions.length > 0
    ? Math.max(...transitions.map(t => t.avg_days))
    : 0

  return (
    <UnlockGate
      feature={featureUnlock}
      title={t('pipelineVelocity.unlockTitle')}
      description={t('pipelineVelocity.unlockDescription')}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('pipelineVelocity.title')}</CardTitle>
            {bottleneckKey && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                <AlertTriangle size={10} className="mr-1" />
                {t('pipelineVelocity.bottleneckDetected')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('pipelineVelocity.subtitle')}</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transitions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {t('pipelineVelocity.noData')}
            </p>
          ) : (
            <div className="space-y-2">
              {transitions.map((tr, i) => (
                <TransitionRow
                  key={i}
                  transition={tr}
                  isBottleneck={`${tr.from}->${tr.to}` === bottleneckKey}
                  maxDays={maxDays}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </UnlockGate>
  )
}
