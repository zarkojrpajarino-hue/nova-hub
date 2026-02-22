/**
 * CALCULATE LEAD SCORE - Edge Function
 *
 * Calcula automáticamente el score de un lead (0-100)
 * Basado en: engagement, company size, industry match, time in pipeline
 *
 * Output:
 * - score: 0-100
 * - classification: Hot/Warm/Cold/MQL/SQL
 * - next_action: Recomendación de siguiente acción
 * - reasoning: Por qué se asignó ese score
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LeadData {
  id: string;
  empresa: string;
  status: string;
  valor_potencial: number;
  created_at: string;
  last_contact_date?: string;
  // Datos adicionales que podríamos tener
  company_size?: string; // 'small' | 'medium' | 'large' | 'enterprise'
  industry?: string;
  engagement_level?: number; // 0-10
}

interface ScoreResult {
  lead_id: string;
  score: number;
  classification: 'hot' | 'warm' | 'cold' | 'mql' | 'sql';
  next_action: string;
  reasoning: string;
  score_breakdown: {
    recency_score: number;
    value_score: number;
    engagement_score: number;
    stage_score: number;
  };
}

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { lead_id } = await req.json();

    if (!lead_id) {
      throw new Error('lead_id is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener datos del lead
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    // Calcular score
    const scoreResult = calculateLeadScore(lead);

    // Guardar score en la base de datos (en metadata del lead)
    await supabaseClient
      .from('leads')
      .update({
        metadata: {
          ...(lead.metadata || {}),
          auto_score: scoreResult.score,
          classification: scoreResult.classification,
          last_scored_at: new Date().toISOString(),
        },
      })
      .eq('id', lead_id);

    return new Response(JSON.stringify(scoreResult), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function calculateLeadScore(lead: LeadData): ScoreResult {
  let totalScore = 0;
  const breakdown = {
    recency_score: 0,
    value_score: 0,
    engagement_score: 0,
    stage_score: 0,
  };

  // 1. RECENCY SCORE (0-25 points)
  // Leads contactados recientemente tienen mayor score
  if (lead.last_contact_date) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceContact <= 1) {
      breakdown.recency_score = 25;
    } else if (daysSinceContact <= 3) {
      breakdown.recency_score = 20;
    } else if (daysSinceContact <= 7) {
      breakdown.recency_score = 15;
    } else if (daysSinceContact <= 14) {
      breakdown.recency_score = 10;
    } else if (daysSinceContact <= 30) {
      breakdown.recency_score = 5;
    } else {
      breakdown.recency_score = 0;
    }
  } else {
    // Nunca contactado = bajo score
    breakdown.recency_score = 5;
  }

  // 2. VALUE SCORE (0-30 points)
  // Mayor valor potencial = mayor score
  const value = lead.valor_potencial || 0;
  if (value >= 50000) {
    breakdown.value_score = 30;
  } else if (value >= 25000) {
    breakdown.value_score = 25;
  } else if (value >= 10000) {
    breakdown.value_score = 20;
  } else if (value >= 5000) {
    breakdown.value_score = 15;
  } else if (value >= 1000) {
    breakdown.value_score = 10;
  } else {
    breakdown.value_score = 5;
  }

  // 3. ENGAGEMENT SCORE (0-20 points)
  // Si tienes engagement_level en metadata
  const engagementLevel = lead.engagement_level || 5; // Default medio
  breakdown.engagement_score = Math.min(20, engagementLevel * 2);

  // 4. STAGE SCORE (0-25 points)
  // Leads en etapas avanzadas tienen mayor score
  const stageScores: Record<string, number> = {
    prospecto: 5,
    contactado: 10,
    cualificado: 15,
    propuesta: 20,
    en_negociacion: 25,
    ganado: 0, // Ya ganado, no necesita score
    perdido: 0, // Perdido, no necesita score
  };
  breakdown.stage_score = stageScores[lead.status] || 0;

  // Calcular score total
  totalScore =
    breakdown.recency_score +
    breakdown.value_score +
    breakdown.engagement_score +
    breakdown.stage_score;

  // Clasificación basada en score
  let classification: ScoreResult['classification'];
  let nextAction: string;

  if (totalScore >= 80) {
    classification = 'hot';
    nextAction = '🔥 Contactar AHORA - Prioridad máxima. Agendar demo o llamada de cierre.';
  } else if (totalScore >= 60) {
    classification = 'sql'; // Sales Qualified Lead
    nextAction = '💼 Enviar propuesta personalizada. Agendar reunión con stakeholders.';
  } else if (totalScore >= 40) {
    classification = 'mql'; // Marketing Qualified Lead
    nextAction = '📊 Nutrir con contenido relevante. Agendar discovery call.';
  } else if (totalScore >= 20) {
    classification = 'warm';
    nextAction = '🌡️ Mantener contacto periódico. Enviar recursos educativos.';
  } else {
    classification = 'cold';
    nextAction = '❄️ Bajo prioridad. Incluir en campañas de nurturing automático.';
  }

  // Reasoning
  const reasoning = `Score basado en: Recencia (${breakdown.recency_score}/25), ` +
    `Valor (${breakdown.value_score}/30), ` +
    `Engagement (${breakdown.engagement_score}/20), ` +
    `Etapa (${breakdown.stage_score}/25)`;

  return {
    lead_id: lead.id,
    score: totalScore,
    classification,
    next_action: nextAction,
    reasoning,
    score_breakdown: breakdown,
  };
}
