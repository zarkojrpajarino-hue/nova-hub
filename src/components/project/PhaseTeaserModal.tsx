/**
 * PhaseTeaserModal — F19.C.4
 *
 * Se abre cuando el usuario clica una tab con status 'teaser'.
 * Explica por qué no está activa ahora y cuándo se desbloquea.
 * t('project.abrirDeTodasFormas') → power user escape hatch.
 */

import { Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { useTranslation } from 'react-i18next';
const TAB_LABELS: Record<string, string> = {
  crm:          'CRM',
  financiero:   t('project.financiero'),
  'negocio-ia': 'Negocio IA',
}

interface PhaseTeaserModalProps {
  open:            boolean
  onOpenChange:    (open: boolean) => void
  tabId:           string
  reason:          string
  unlockCondition: string
  onOpenAnyway:    () => void
}

export function PhaseTeaserModal({
  open,
  onOpenChange,
  tabId,
  reason,
  unlockCondition,
  onOpenAnyway,
}: PhaseTeaserModalProps) {
  const { t } = useTranslation();
  const tabLabel = TAB_LABELS[tabId] ?? tabId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {tabLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {reason}
          </p>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Se activa cuando:
            </p>
            <p className="text-sm">{unlockCondition}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >{t('project.entendido')}</Button>
          <Button
            variant="ghost"
            className="flex-1 text-muted-foreground text-xs"
            onClick={() => {
              onOpenChange(false)
              onOpenAnyway()
            }}
          >
            Abrir de todas formas →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
