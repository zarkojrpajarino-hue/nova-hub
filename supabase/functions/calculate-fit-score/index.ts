/**
 * CALCULATE FIT SCORE - Edge Function
 *
 * Calcula el Fit Score de un miembro en un rol durante período de exploración
 *
 * Fórmula:
 * - 50% Métricas Objetivas (tareas, OBVs, puntualidad)
 * - 30% Peer Feedback (evaluaciones 360°)
 * - 10% Auto-Evaluación (confianza + disfrute)
 * - 10% Owner Evaluation (fit + impacto)
 *
 * Score final: 0.0 - 5.0
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


interface FitScoreRequest {
  exploration_period_id: string;
}

interface ObjectiveMetrics {
  tasks_completed: number;
  tasks_assigned: number;
  tasks_on_time: number;
  obvs_created: number;
  obvs_validated: number;
  initiative_obvs: number;
}

interface PeerFeedbackMetrics {
  avg_collaboration: number;
  avg_quality: number;
  avg_communication: number;
  avg_initiative: number;
  avg_technical: number;
  total_count: number;
}

interface SelfEvaluation {
  confidence: number;
  enjoyment: number;
}

interface OwnerEvaluation {
  fit_rating: number;
  impact_rating: number;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Handle CORS
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
        const { serviceClient: supabaseClient } = await validateAuth(req);

    const { exploration_period_id } = await req.json() as FitScoreRequest;

    if (!exploration_period_id) {
      return new Response(
        JSON.stringify({ error: 'exploration_period_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 1. Obtener el período de exploración
    const { data: exploration, error: expError } = await supabaseClient
      .from('role_exploration_periods')
      .select('*')
      .eq('id', exploration_period_id)
      .single();

    if (expError || !exploration) {
      return new Response(
        JSON.stringify({ error: 'Exploration period not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 2. Obtener métricas objetivas
    const objectiveMetrics: ObjectiveMetrics = {
      tasks_completed: exploration.tasks_completed || 0,
      tasks_assigned: 10, // TODO: Obtener de tasks table
      tasks_on_time: exploration.tasks_completed || 0, // TODO: Calcular realmente
      obvs_created: exploration.obvs_completed || 0,
      obvs_validated: exploration.obvs_completed || 0,
      initiative_obvs: exploration.initiative_obvs || 0,
    };

    // 3. Obtener peer feedback promedio
    const { data: peerFeedback } = await supabaseClient
      .from('peer_feedback')
      .select('*')
      .eq('exploration_period_id', exploration_period_id);

    const peerMetrics: PeerFeedbackMetrics = {
      avg_collaboration: 0,
      avg_quality: 0,
      avg_communication: 0,
      avg_initiative: 0,
      avg_technical: 0,
      total_count: peerFeedback?.length || 0,
    };

    if (peerFeedback && peerFeedback.length > 0) {
      peerMetrics.avg_collaboration = average(peerFeedback.map(f => f.collaboration_rating));
      peerMetrics.avg_quality = average(peerFeedback.map(f => f.quality_rating));
      peerMetrics.avg_communication = average(peerFeedback.map(f => f.communication_rating));
      peerMetrics.avg_initiative = average(peerFeedback.map(f => f.initiative_rating));
      peerMetrics.avg_technical = average(peerFeedback.map(f => f.technical_skills_rating));
    }

    // 4. Auto-evaluación
    const selfEval: SelfEvaluation = {
      confidence: exploration.self_rating || 0,
      enjoyment: exploration.self_rating || 0, // TODO: Separar confidence y enjoyment
    };

    // 5. Owner evaluation
    const ownerEval: OwnerEvaluation = {
      fit_rating: exploration.owner_fit_rating || 0,
      impact_rating: exploration.owner_impact_rating || 0,
    };

    // 6. CALCULAR FIT SCORE
    const fitScore = calculateFitScore(objectiveMetrics, peerMetrics, selfEval, ownerEval);

    // 7. Actualizar en DB
    const { error: updateError } = await supabaseClient
      .from('role_exploration_periods')
      .update({
        fit_score: fitScore,
        peer_feedback_avg: average([
          peerMetrics.avg_collaboration,
          peerMetrics.avg_quality,
          peerMetrics.avg_communication,
          peerMetrics.avg_initiative,
          peerMetrics.avg_technical,
        ]),
        updated_at: new Date().toISOString(),
      })
      .eq('id', exploration_period_id);

    if (updateError) {
      console.error('Error updating fit score:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fit_score: fitScore,
        breakdown: {
          objective: calculateObjectiveScore(objectiveMetrics),
          peer: calculatePeerScore(peerMetrics),
          self: calculateSelfScore(selfEval),
          owner: calculateOwnerScore(ownerEval),
        },
        metrics: {
          objective: objectiveMetrics,
          peer: peerMetrics,
          self: selfEval,
          owner: ownerEval,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error calculating fit score:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

function calculateFitScore(
  obj: ObjectiveMetrics,
  peer: PeerFeedbackMetrics,
  self: SelfEvaluation,
  owner: OwnerEvaluation
): number {
  const objectiveScore = calculateObjectiveScore(obj);
  const peerScore = calculatePeerScore(peer);
  const selfScore = calculateSelfScore(self);
  const ownerScore = calculateOwnerScore(owner);

  // Pesos: 50% objetivo, 30% peer, 10% self, 10% owner
  const totalScore = (
    objectiveScore * 0.5 +
    peerScore * 0.3 +
    selfScore * 0.1 +
    ownerScore * 0.1
  );

  // Scale to 0-5
  return Math.min(Math.max(totalScore * 5, 0), 5);
}

function calculateObjectiveScore(metrics: ObjectiveMetrics): number {
  const tasksCompletionRate = metrics.tasks_assigned > 0
    ? metrics.tasks_completed / metrics.tasks_assigned
    : 0;

  const tasksOnTimeRate = metrics.tasks_completed > 0
    ? metrics.tasks_on_time / metrics.tasks_completed
    : 0;

  const obvsRate = metrics.obvs_created > 0
    ? Math.min(metrics.obvs_created / 5, 1) // Normalizado a 5 OBVs
    : 0;

  const obvsValidatedRate = metrics.obvs_created > 0
    ? metrics.obvs_validated / metrics.obvs_created
    : 0;

  const initiativeRate = Math.min(metrics.initiative_obvs / 3, 1); // Normalizado a 3 OBVs de iniciativa

  // Pesos internos: tasks 40%, on-time 30%, obvs 15%, validated 10%, initiative 5%
  return (
    tasksCompletionRate * 0.40 +
    tasksOnTimeRate * 0.30 +
    obvsRate * 0.15 +
    obvsValidatedRate * 0.10 +
    initiativeRate * 0.05
  );
}

function calculatePeerScore(metrics: PeerFeedbackMetrics): number {
  if (metrics.total_count === 0) {
    return 0; // Sin feedback, score 0
  }

  // Promedio de todos los ratings (ya están en escala 1-5)
  const avg = average([
    metrics.avg_collaboration,
    metrics.avg_quality,
    metrics.avg_communication,
    metrics.avg_initiative,
    metrics.avg_technical,
  ]);

  // Normalizar de escala 1-5 a 0-1
  return (avg - 1) / 4;
}

function calculateSelfScore(evaluation: SelfEvaluation): number {
  if (evaluation.confidence === 0 && evaluation.enjoyment === 0) {
    return 0;
  }

  // Promedio de confianza y disfrute (escala 1-5)
  const avg = (evaluation.confidence + evaluation.enjoyment) / 2;

  // Normalizar de 1-5 a 0-1
  return (avg - 1) / 4;
}

function calculateOwnerScore(evaluation: OwnerEvaluation): number {
  if (evaluation.fit_rating === 0 && evaluation.impact_rating === 0) {
    return 0;
  }

  // Promedio de fit e impacto (escala 1-5)
  const avg = (evaluation.fit_rating + evaluation.impact_rating) / 2;

  // Normalizar de 1-5 a 0-1
  return (avg - 1) / 4;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum / numbers.length;
}
