/**
 * getNextAction — lógica pura de Next Action del engine.
 *
 * Extraída de ProjectEnginePanel.tsx para ser reutilizable en:
 * - ProjectEnginePanel (display)
 * - ReentrySurface (resumen de re-entrada)
 * - ResetSurface (contexto para Optimus §8)
 *
 * No importa componentes UI. Solo tipos del engine y lógica pura.
 */

import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

// =============================================================================
// Next Action
//
// Lógica de prioridad (en orden de evaluación):
//   1. Riesgo crítico → bloquea toda acción de fase
//   2. Riesgo alto fase 3+ → bloquea escala
//   3–6. Fase 1–2 → validación de demanda / canal / métricas
//   7–8. Fase 3 → operación + evidencia
//   9–12. Fase 4 (terminal en v1) → escala saludable
//
// Inputs relevantes por fase: phase, phaseScore, hardSignalMet, riskStatus, riskLevel,
//   probStatus, coverage (demand/delivery/cash).
//
// Nota: caso demandWeak + hardSignalMet=true es teóricamente improbable
// (hard signal F2 requiere OBV de revenue que debería elevar demand coverage),
// pero se mantiene por si coverage y hard signal divergen en edge cases reales.
//
// Fase 4 (Escala — terminal en v1): nunca devuelve null.
//   opsWeak en fase 4 = regresión operativa en escala (delivery/cash debilitados).
//   probStatus proxy de crecimiento (O4.1): inactive/low_confidence → sin datos MRR.
//   hard_signal_met = O4.1≥33 AND O4.2≥50 AND risk NOT IN ('high','critical').
//
// actionType:
//   'create_obv'  → navegar a tab OBVs
//   'add_metrics' → navegar a tab Financiero
//   (sin tipo)    → solo texto, sin botón
// =============================================================================

export type NextAction = {
  title: string;
  description: string;
  actionType?: 'create_obv' | 'add_metrics' | 'define_channel' | 'create_task' | 'open_meeting';
  ctaLabel?: string;
} | null;

export function getNextAction(engineData: ProjectEngineData | null | undefined): NextAction {
  if (!engineData) return null;

  const phase         = engineData.phaseState?.current_phase  ?? 1;
  const phaseScore    = engineData.phaseState?.phase_score     ?? 0;
  const hardSignalMet = engineData.phaseState?.hard_signal_met ?? false;
  const riskStatus    = engineData.risk?.risk_status           ?? 'insufficient_data';
  const riskLevel     = engineData.risk?.risk_level            ?? 'low';
  const probStatus    = engineData.probability?.probability_status ?? 'inactive';
  const coverage      = engineData.coverage ?? [];

  const coverageLevel = (type: string) =>
    coverage.find(c => c.function_type === type)?.coverage_level ?? 'none';

  const demand   = coverageLevel('demand');
  const delivery = coverageLevel('delivery');
  const cash     = coverageLevel('cash');

  const demandWeak = demand   === 'none' || demand   === 'basic';
  const opsWeak    = delivery === 'none' || delivery === 'basic'
                  || cash     === 'none' || cash     === 'basic';

  // 1. Riesgo crítico — bloquea siempre, independiente de fase
  if (riskStatus === 'active' && riskLevel === 'critical') {
    return {
      title: 'Reduce el riesgo crítico antes de avanzar',
      description: 'Hay un riesgo crítico activo que puede invalidar el progreso actual.',
    };
  }

  // 2. Riesgo alto — solo bloquea en fase 3+ (en fases tempranas hay acciones más desbloqueantes)
  if (riskStatus === 'active' && riskLevel === 'high' && phase >= 3) {
    return {
      title: 'Reduce el riesgo principal antes de escalar',
      description: 'Antes de consolidar la fase actual, resuelve el riesgo más alto del proyecto.',
    };
  }

  // [B3/U3.1] Fase 0 — Exploración pre-idea
  if (phase === 0) {
    return {
      title: 'Explora ideas y define tu problema',
      description: 'Tu primer paso es identificar un problema real que quieras resolver. Escribe al menos 3 ideas y valida cuál tiene más potencial.',
      actionType: 'create_task',
      ctaLabel: 'Ver tareas',
    };
  }

  // 3. Fase 1
  if (phase === 1) {
    if (!hardSignalMet || demandWeak) {
      return {
        title: 'Valida el problema con señales reales',
        description: 'Aún falta evidencia suficiente de demanda. Crea un OBV de descubrimiento.',
        actionType: 'create_obv',
        ctaLabel: 'Crear OBV',
      };
    }
  }

  // 4–6. Fase 2
  if (phase === 2) {
    // 4. Sin hard signal + demand débil → seguir validando demanda
    if (!hardSignalMet && demandWeak) {
      return {
        title: 'Valida la demanda con más evidencia',
        description: 'Todavía no hay señal fuerte de demanda. Necesitas más evidencia antes de estructurar adquisición.',
        actionType: 'create_obv',
        ctaLabel: 'Crear OBV',
      };
    }

    // 5. Demand débil pero hard signal cumplida y score alto → canal (señal suficiente para estructurar)
    if (demandWeak && hardSignalMet && phaseScore >= 70) {
      return {
        title: 'Define tu canal de adquisición',
        description: 'Ya hay señal suficiente para empezar a estructurar un canal primario con playbook.',
        actionType: 'define_channel',
        ctaLabel: 'Ir al canal',
      };
    }

    // 6. Demand ok + prob no activa → pedir métricas cuantitativas
    if (!demandWeak && (probStatus === 'inactive' || probStatus === 'low_confidence')) {
      return {
        title: 'Añade métricas para mejorar la señal',
        description: 'Necesitas más señal cuantitativa para que la probabilidad sea fiable.',
        actionType: 'add_metrics',
        ctaLabel: 'Ver métricas',
      };
    }
  }

  // 7–8. Fase 3
  if (phase === 3) {
    // 7. Ops débiles (none o basic) — incluye basic porque escalar con basic también es prematuro
    if (opsWeak) {
      return {
        title: 'Refuerza la operación antes de escalar',
        description: 'Entrega y caja aún no están suficientemente consolidadas para sostener crecimiento.',
        actionType: 'create_obv',
        ctaLabel: 'Crear OBV',
      };
    }

    // 8. Ops ok pero hard signal sin cumplir → evidencia operativa
    if (!hardSignalMet) {
      return {
        title: 'Consolida evidencia operativa clave',
        description: 'La fase actual necesita señales más sólidas antes de seguir avanzando.',
        actionType: 'create_obv',
        ctaLabel: 'Crear OBV',
      };
    }
  }

  // 9–12. Fase 4 — Escala (terminal en v1)
  //
  // Fase 4 nunca devuelve null: siempre hay algo que mantener o mejorar.
  // opsWeak aquí = regresión operativa (pasaron fase 3, algo se ha degradado).
  // probStatus = proxy de crecimiento MRR (O4.1): inactive/low_confidence → sin datos.
  if (phase === 4) {
    // 9. Ops degradadas → OBV operativo urgente
    if (opsWeak) {
      return {
        title: 'Estabiliza la operación en escala',
        description: 'Entrega o caja se han debilitado. Resuelve el problema operativo antes de mantener el crecimiento.',
        actionType: 'create_obv',
        ctaLabel: 'Crear OBV',
      };
    }

    // 10. Sin datos de crecimiento cuantificados → métricas MRR
    if (probStatus === 'inactive' || probStatus === 'low_confidence') {
      return {
        title: 'Registra el ritmo de crecimiento',
        description: 'Sin datos de MRR consistentes no es posible evaluar si el crecimiento es sostenido.',
        actionType: 'add_metrics',
        ctaLabel: 'Ver métricas',
      };
    }

    // 11. Hard signal no cumplida (crecimiento insuficiente o ejecución débil)
    if (!hardSignalMet) {
      return {
        title: 'Revisa las condiciones de escala saludable',
        description: 'El proyecto aún no cumple las señales de crecimiento sostenido. Revisa ritmo MoM, márgenes y ejecución.',
        actionType: 'add_metrics',
        ctaLabel: 'Ver métricas',
      };
    }

    // 12. Hard signal cumplida → mantener momentum
    return {
      title: 'Mantén el momentum de crecimiento',
      description: 'El proyecto opera a escala saludable. Mantén el ritmo semana a semana y documenta lo que funciona.',
      actionType: 'add_metrics',
      ctaLabel: 'Ver métricas',
    };
  }

  return null;
}
