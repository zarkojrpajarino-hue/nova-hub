/**
 * UnlockProgress — GUARD.2
 *
 * Shows progress toward unlocking a feature.
 * Never says "blocked" — always shows "N of M steps to unlock".
 * Each step has a CTA. Tone: positive, gamified.
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, ArrowRight, Lock, Unlock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FeatureUnlock } from '@/hooks/useUnlockProgress'

interface UnlockProgressProps {
  feature: FeatureUnlock
  title: string
  description?: string
}

export function UnlockProgress({ feature, title, description }: UnlockProgressProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (feature.unlocked) return null

  const doneCount = feature.steps.filter(s => s.done).length
  const totalCount = feature.steps.length

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lock size={14} className="text-primary" />
          {title}
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {doneCount}/{totalCount}
          </Badge>
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${feature.progress_percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {feature.progress_percent}% — {totalCount - doneCount} {t('guard.stepsRemaining')}
        </p>

        {/* Steps checklist */}
        <div className="space-y-2">
          {feature.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {step.done ? (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <Circle size={16} className="text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={`text-xs flex-1 ${step.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                {step.label}
              </span>
              {!step.done && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-xs gap-1 text-primary"
                  onClick={() => navigate(step.cta_action)}
                >
                  {t('guard.go')}
                  <ArrowRight size={10} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface UnlockGateProps {
  feature: FeatureUnlock | null
  title: string
  description?: string
  children: React.ReactNode
}

/**
 * Wraps content and shows UnlockProgress if feature is not unlocked.
 * If unlocked or feature is null (loading), shows children.
 */
export function UnlockGate({ feature, title, description, children }: UnlockGateProps) {
  if (!feature || feature.unlocked) {
    return <>{children}</>
  }
  return <UnlockProgress feature={feature} title={title} description={description} />
}
