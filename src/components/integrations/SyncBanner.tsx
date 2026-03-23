/**
 * SyncBanner
 *
 * Muestra el delta de motores después de un sync exitoso.
 * Solo se renderiza si hay cambios (direction !== 'unchanged').
 */

import { X, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { computeEngineDelta, type EngineSnapshot, type EngineDeltaItem } from '@/lib/engine-delta'

import { useTranslation } from 'react-i18next';
interface SyncBannerProps {
  pre: EngineSnapshot | null
  post: EngineSnapshot
  onDismiss: () => void
}

function DirectionArrow({ item }: { item: EngineDeltaItem }) {
  const { t: _t } = useTranslation();
  if (item.direction === 'new') {
    return <Sparkles size={14} className="text-blue-500" />
  }
  if (item.direction === 'up') {
    return <TrendingUp size={14} className="text-green-500" />
  }
  if (item.direction === 'down') {
    return <TrendingDown size={14} className="text-red-500" />
  }
  return null
}

export function SyncBanner({ pre, post, onDismiss }: SyncBannerProps) {
  const delta = computeEngineDelta(pre, post).filter((d) => d.direction !== 'unchanged')

  if (delta.length === 0) return null

  return (
    <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{t('integrations.syncCompletadoOptimusRecalculó')}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
          aria-label={t('integrations.cerrar')}
        >
          <X size={14} />
        </Button>
      </div>

      <div className="space-y-2">
        {delta.map((item) => (
          <div key={item.metric} className="flex items-center gap-2 text-sm">
            <DirectionArrow item={item} />
            <span className="text-muted-foreground font-medium w-36 shrink-0">
              {item.label}
            </span>
            <span className="text-muted-foreground">
              {item.before !== null ? String(item.before) : '—'}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={item.isBusinessImprovement ? 'text-green-600 font-semibold' : ''}>
              {item.after !== null ? String(item.after) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
