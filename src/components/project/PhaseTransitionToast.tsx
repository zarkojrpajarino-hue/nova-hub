import { useState, useEffect, useMemo } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS, PHASE_DESCRIPTIONS } from '@/lib/engine';

import { useTranslation } from 'react-i18next';
const TRANSITION_DURATION_MS = 4000;

// ── Hook ──────────────────────────────────────────────────────────────────────

interface TransitionInfo {
  toPhase: number;
  fromPhase: number;
}

function usePhaseTransition(
  phaseHistory: ProjectEngineData['phaseHistory'],
  projectId: string,
): {
  visible: boolean;
  info: TransitionInfo | null;
  dismiss: () => void;
} {
  const info = useMemo((): TransitionInfo | null => {
    if (phaseHistory.length < 2) return null;
    const curr = phaseHistory[0];
    const prev = phaseHistory[1];
    return curr.phase > prev.phase ? { toPhase: curr.phase, fromPhase: prev.phase } : null;
  }, [phaseHistory]);

  const sessionKey = info ? `phase_transition_seen_${projectId}_${info.toPhase}` : null;

  const [visible, setVisible] = useState(() =>
    sessionKey ? !sessionStorage.getItem(sessionKey) : false,
  );

  // Re-sincronizar si los datos del hook llegan async (React Query)
  useEffect(() => {
    setVisible(sessionKey ? !sessionStorage.getItem(sessionKey) : false);
  }, [sessionKey]);

  // Marcar como visto + auto-dismiss
  useEffect(() => {
    if (!visible || !sessionKey) return;
    sessionStorage.setItem(sessionKey, '1');
    const timer = setTimeout(() => setVisible(false), TRANSITION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, sessionKey]);

  return { visible, info, dismiss: () => setVisible(false) };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PhaseTransitionToastProps {
  engineData: ProjectEngineData | null | undefined;
  projectId: string;
  onViewDetails?: () => void; // navegar al panel del engine (dashboard tab)
}

export function PhaseTransitionToast({ engineData, projectId, onViewDetails }: PhaseTransitionToastProps) {
  const { t } = useTranslation();
  const { visible, info, dismiss } = usePhaseTransition(
    engineData?.phaseHistory ?? [],
    projectId,
  );

  // Animación de entrada
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (visible) requestAnimationFrame(() => setMounted(true));
    else setMounted(false);
  }, [visible]);

  if (!visible || !info) return null;

  const phaseLabel = PHASE_LABELS[info.toPhase] ?? `Fase ${info.toPhase}`;
  const phaseDesc  = PHASE_DESCRIPTIONS[info.toPhase];

  function handleViewDetails() {
    dismiss();
    onViewDetails?.();
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 transition-all duration-500 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                Proyecto avanzó a Fase {info.toPhase}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('project.elSistemaDetectóSuficientes')}</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label={t('project.cerrar')}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Phase preview */}
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-xs font-medium">{phaseLabel}</p>
          {phaseDesc && (
            <p className="text-xs text-muted-foreground leading-relaxed">{phaseDesc}</p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 pt-0.5">
          <button
            onClick={handleViewDetails}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >{t('project.verQuéCambia')}<ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={dismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >{t('project.continuar')}</button>
        </div>
      </div>
    </div>
  );
}
