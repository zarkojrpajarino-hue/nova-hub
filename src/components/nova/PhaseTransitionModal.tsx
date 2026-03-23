import { useEffect, useRef } from 'react';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PHASE_LABELS, PHASE_METHODOLOGY } from '@/lib/engine';
import type { PhaseTransitionState } from '@/hooks/usePhaseTransitionNotification';

import { useTranslation } from 'react-i18next';
interface PhaseTransitionModalProps {
  state: PhaseTransitionState;
  onClose: () => void;
}

// Emoji decorations per phase (purely cosmetic)
const PHASE_EMOJI: Record<number, string> = {
  0: '🌱',
  1: '🔍',
  2: '⚡',
  3: '💰',
  4: '🚀',
};

// [V24.8] Tabs que se desbloquean al entrar en esta fase
function getPhaseUnlockedTabs(t: (k: string) => string): Record<number, string[]> {
  return {
    1: [t('nova.obvs')],
    2: ['CRM'],
    3: [t('nova.financiero')],
    4: ['Negocio IA'],
  };
}

export function PhaseTransitionModal({ state, onClose }: PhaseTransitionModalProps) {
  const { t } = useTranslation();
  const PHASE_UNLOCKED_TABS = getPhaseUnlockedTabs(t);
  const { open, newPhase } = state;
  const prevPhase = newPhase - 1;

  const label = PHASE_LABELS[newPhase] ?? `Fase ${newPhase}`;
  const emoji = PHASE_EMOJI[newPhase] ?? '🏆';

  // Auto-close after 12 s so it never blocks work if user ignores it
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(onClose, 12_000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="nova-gradient p-8 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse-glow">
              <Trophy size={40} className="text-white" />
            </div>
            <Sparkles
              size={20}
              className="absolute -top-1 -right-1 text-yellow-300 animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>
          <DialogTitle className="text-white text-xl font-bold">{t('nova.nuevaFaseDesbloqueada')}</DialogTitle>
          <DialogDescription className="text-white/80 text-sm">{t('nova.elMotorHaConfirmado')}</DialogDescription>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Phase transition indicator */}
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              Fase {prevPhase}
            </span>
            <ArrowRight size={16} className="text-primary" />
            <span className="px-3 py-1.5 rounded-full nova-gradient-subtle nova-border text-primary font-semibold">
              Fase {newPhase}
            </span>
          </div>

          {/* New phase name */}
          <div className="space-y-1">
            <p className="text-3xl">{emoji}</p>
            <p className="text-lg font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">{t('nova.tuEquipoHaAlcanzado')}</p>
          </div>

          {/* [V24.8] Metodología + tabs desbloqueados */}
          <div className="text-left space-y-2 bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground">{t('nova.metodologíaActiva')}</p>
            <p className="text-sm font-semibold">{PHASE_METHODOLOGY[newPhase]}</p>
            {PHASE_UNLOCKED_TABS[newPhase] && PHASE_UNLOCKED_TABS[newPhase].length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground mt-2">{t('nova.nuevosTabsDisponibles')}</p>
                <div className="flex gap-1.5">
                  {PHASE_UNLOCKED_TABS[newPhase].map((tab) => (
                    <span key={tab} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      {tab}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button onClick={onClose} className="w-full nova-gradient text-white">{t('nova.continuar')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
