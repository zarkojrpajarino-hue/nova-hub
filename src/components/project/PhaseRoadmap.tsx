/**
 * V24.1 — PhaseRoadmap: mapa visual de progresión (5 fases)
 *
 * Muestra las 5 fases (0-4) como un camino visual horizontal.
 * - Fase actual resaltada con anillo pulsante
 * - Fases completadas con check verde
 * - Fases futuras en gris con popover de desbloqueo
 * - Si graduated: badge "Graduado" al final
 *
 * Incluye:
 * - V24.2: PhaseExplainer (por qué estás en esta fase)
 * - V24.3: PhaseUnlockChecklist (qué necesitas para avanzar)
 * - V24.4: PhaseScoreBar (progreso 0-100 con marca en 75)
 */

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Lock, GraduationCap } from 'lucide-react';
import { PHASE_LABELS, PHASE_DESCRIPTIONS, PHASE_METHODOLOGY } from '@/lib/engine';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PhaseRunwayIndicator } from './PhaseRunwayIndicator';

// ── Phase Explainer texts (V24.2) ────────────────────────────────────────────

function getPhaseExplainerText(phase: number, score: number, hardSignal: boolean): string {
  const scoreText = `Score actual: ${Math.round(score)}%`;
  const signalText = hardSignal ? 'Señal dura cumplida.' : 'Falta señal dura.';

  switch (phase) {
    case 0: return `Estás explorando ideas y problemas. ${scoreText}. ${signalText}`;
    case 1: return `Estás validando que el problema es real. ${scoreText}. ${signalText}`;
    case 2: return `Estás validando que tu solución genera demanda. ${scoreText}. ${signalText}`;
    case 3: return `Tu modelo está operando. Demuestra ingresos sostenibles. ${scoreText}. ${signalText}`;
    case 4: return `Modelo validado, consolidando y escalando. ${scoreText}. ${signalText}`;
    default: return scoreText;
  }
}

// ── Unlock conditions per phase transition (V24.3) ───────────────────────────

interface UnlockItem {
  label: string;
  met: boolean;
}

// Nota: hard_signal_met es booleano global — no sabemos cuáles sub-condiciones
// individuales están cumplidas (ej. "tiene 7/10 entrevistas" vs "falta estrategia").
// Para evitar engañar al usuario (todo check o todo lock), mostramos:
// - Score ≥ 75% → verificable con dato real
// - Velocity ≥ 2 → verificable con dato real
// - "Señal dura" como agrupación → refleja hard_signal_met directamente
// Mejora futura: endpoint SQL que retorne cada sub-condición individualmente.
function getUnlockChecklist(nextPhase: number, score: number, hardSignal: boolean): UnlockItem[] {
  const scoreMet = score >= 75;

  switch (nextPhase) {
    case 1: return [
      { label: 'Score ≥ 75%', met: scoreMet },
      { label: 'Señal dura: idea seleccionada + segmento definido', met: hardSignal },
    ];
    case 2: return [
      { label: 'Score ≥ 75%', met: scoreMet },
      { label: 'Señal dura: ≥10 entrevistas, ≥30% dolor, estrategia definida', met: hardSignal },
    ];
    case 3: return [
      { label: 'Score ≥ 75%', met: scoreMet },
      { label: 'Señal dura: primer pago + revenue momentum ≥ 40', met: hardSignal },
    ];
    case 4: return [
      { label: 'Score ≥ 75%', met: scoreMet },
      { label: 'Señal dura: 3 meses estables + ≥3 tareas en 28 días', met: hardSignal },
    ];
    default: return [];
  }
}

// ── Score Bar (V24.4) ────────────────────────────────────────────────────────

function PhaseScoreBar({ score, status }: { score: number; status: string }) {
  const color = status === 'healthy' ? 'bg-green-500' : status === 'friction' ? 'bg-yellow-500' : 'bg-red-500';
  const rounded = Math.round(score);

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Score de fase</span>
        <span className="font-semibold tabular-nums">{rounded}%</span>
      </div>
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        {/* Marca en 75% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
          style={{ left: '75%' }}
          title="Umbral de avance: 75%"
        />
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(2, rounded)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>0</span>
        <span className="text-gray-400">75</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface PhaseRoadmapProps {
  engineData: ProjectEngineData | null | undefined;
}

export function PhaseRoadmap({ engineData }: PhaseRoadmapProps) {
  const [expanded, setExpanded] = useState(false);

  if (!engineData?.phaseState) return null;

  const currentPhase = engineData.phaseState.current_phase;
  const score = engineData.phaseState.phase_score;
  const status = engineData.phaseState.phase_status;
  const hardSignal = engineData.phaseState.hard_signal_met;
  const graduated = engineData.phaseState.graduated ?? false;

  const phases = [0, 1, 2, 3, 4];

  return (
    <div className="bg-card border rounded-lg p-4">
      {/* Phase dots */}
      <div className="flex items-center justify-between">
        {phases.map((phase, idx) => {
          const isCompleted = phase < currentPhase;
          const isCurrent = phase === currentPhase;
          const isFuture = phase > currentPhase;

          return (
            <div key={phase} className="flex items-center flex-1">
              {/* Dot */}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex flex-col items-center group relative cursor-pointer"
              >
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse' : ''}
                  ${isFuture ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : phase}
                </div>
                <span className={`text-[11px] mt-1.5 text-center leading-tight max-w-[80px] ${
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}>
                  {PHASE_LABELS[phase]}
                </span>
              </button>

              {/* Connector line */}
              {idx < phases.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-[-18px] ${
                  phase < currentPhase ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}

        {/* Graduated badge */}
        {graduated && (
          <div className="flex flex-col items-center ml-2">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-[11px] mt-1.5 font-semibold text-amber-600">Graduado</span>
          </div>
        )}
      </div>

      {/* Expand/collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Ocultar detalle' : 'Ver progreso y requisitos'}
      </button>

      {/* Expanded content: V24.2 + V24.3 + V24.4 */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* V24.2 — Phase Explainer + V24.7 — Metodología */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold">
                Fase {currentPhase} — {PHASE_LABELS[currentPhase]}
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {PHASE_METHODOLOGY[currentPhase]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {PHASE_DESCRIPTIONS[currentPhase]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getPhaseExplainerText(currentPhase, score, hardSignal)}
            </p>
          </div>

          {/* V24.4 — Score Bar */}
          <PhaseScoreBar score={score} status={status} />

          {/* PI27.4 — Phase Runway Indicator */}
          {currentPhase < 4 && (
            <PhaseRunwayIndicator
              engineData={engineData!}
              scoreHistory={engineData!.phaseHistory.map(h => h.phase_score).reverse()}
            />
          )}

          {/* V24.3 — Unlock Checklist (solo si no estás en Phase 4 o no graduated) */}
          {currentPhase < 4 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Para avanzar a Fase {currentPhase + 1} — {PHASE_LABELS[currentPhase + 1]}
              </h4>
              <div className="space-y-1.5">
                {getUnlockChecklist(currentPhase + 1, score, hardSignal).map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.met ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graduation status for Phase 4 */}
          {currentPhase === 4 && !graduated && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Graduación</h4>
              <p className="text-xs text-muted-foreground">
                Mantén tu score ≥ 75% durante 28 días consecutivos para graduarte y entrar en Ciclos Estratégicos.
                {engineData.phaseState.graduation_eligible_since
                  ? ` Elegible desde: ${new Date(engineData.phaseState.graduation_eligible_since).toLocaleDateString()}`
                  : ' Aún no elegible — necesitas score ≥ 75%.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
