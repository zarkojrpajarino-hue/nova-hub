/**
 * usePhaseTransitionNotification
 *
 * Detecta cambios en phase_state tras un refetch de ['project-engine', projectId]
 * y dispara feedback visual:
 *
 *   current_phase > prevPhase  → devuelve estado para modal celebratorio
 *   phase_score - prevScore ≥ 10 (sin cambio de fase) → toast discreto
 *
 * Solo detecta subidas, no bajadas (v1).
 *
 * Mecanismo: useRef para trackear valores previos + useEffect sobre
 * valores primitivos (no el objeto) para evitar re-renders espúreos.
 *
 * Placement: IndexContent (siempre montado mientras el usuario está en el proyecto).
 */

import { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';

export interface PhaseTransitionState {
  open: boolean;
  newPhase: number;
}

export function usePhaseTransitionNotification(projectId: string | undefined) {
  const { data: engineData } = useProjectEngineData(projectId);

  const prevPhaseRef = useRef<number | null>(null);
  const prevScoreRef = useRef<number | null>(null);

  const [phaseModal, setPhaseModal] = useState<PhaseTransitionState>({
    open: false,
    newPhase: 1,
  });

  const currentPhase = engineData?.phaseState?.current_phase ?? null;
  const currentScore = engineData?.phaseState?.phase_score ?? null;

  useEffect(() => {
    if (currentPhase == null || currentScore == null) return;

    const prevPhase = prevPhaseRef.current;
    const prevScore = prevScoreRef.current;

    // Skip first render — no previous value to compare
    if (prevPhase !== null && prevScore !== null) {
      if (currentPhase > prevPhase) {
        // Phase number increased → modal celebratorio
        setPhaseModal({ open: true, newPhase: currentPhase });
      } else if (currentScore - prevScore >= 10) {
        // Score improved ≥10 pts without phase change → toast discreto
        const delta = (currentScore - prevScore).toFixed(0);
        const phaseLabel = PHASE_LABELS[currentPhase] ?? `Fase ${currentPhase}`;
        toast.success('Motor actualizado', {
          description: `+${delta} pts en ${phaseLabel} (${currentScore.toFixed(0)}/100)`,
          duration: 4000,
        });
      }
    }

    prevPhaseRef.current = currentPhase;
    prevScoreRef.current = currentScore;
  // Primitive dependencies — effect only runs when actual values change
  }, [currentPhase, currentScore]);

  const closePhaseModal = () =>
    setPhaseModal((prev) => ({ ...prev, open: false }));

  return { phaseModal, closePhaseModal };
}
