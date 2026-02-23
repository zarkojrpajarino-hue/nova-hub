/**
 * AI CAREER COACH - Edge Function
 *
 * Coach de IA conversacional para desarrollo de carrera
 * Proporciona consejos personalizados basados en:
 * - Skills actuales del usuario
 * - Objetivos de carrera
 * - Historial de conversacion
 *
 * Input:
 * - user_id: UUID del usuario
 * - message: Mensaje del usuario
 * - session_id: ID de sesion (opcional, crea nueva si no existe)
 * - topic: Tema de la conversacion (opcional)
 *
 * Output:
 * - response: Respuesta del coach
 * - insights: Insights generados
 * - action_items: Acciones sugeridas
 * - session_id: ID de la sesion
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface CoachInsight {
  type: string;
  content: string;
  created_at: string;
}

interface CoachActionItem {
  title: string;
  description: string;
  priority: string;
  created_at: string;
}

interface SkillGap {
  skill_name: string;
  gap: number;
}

interface UserStats {
  total_skills?: number;
  avg_skill_level?: number;
  learning_paths_active?: number;
  total_feedback_received?: number;
}

interface CareerGoal {
  id: string;
  title: string;
  status: string;
}

interface UserContext {
  stats?: UserStats;
  skillGaps: SkillGap[];
  careerGoals: CareerGoal[];
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, message, session_id, topic } = await req.json();

    if (!user_id || !message) {
      throw new Error('user_id and message are required');
    }

    // Initialize Supabase client
        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    const rateLimitResult = await checkRateLimit(user_id, 'ai-career-coach', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // 1. Obtener o crear sesion
    let currentSession;
    if (session_id) {
      const { data } = await supabaseClient
        .from('ai_coach_sessions')
        .select('*')
        .eq('id', session_id)
        .single();
      currentSession = data;
    }

    if (!currentSession) {
      // Crear nueva sesion
      const { data: newSession, error: sessionError } = await supabaseClient
        .from('ai_coach_sessions')
        .insert({
          user_id,
          topic: topic || 'general',
          conversation_history: [],
          insights: [],
          action_items: [],
          status: 'active',
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error('Failed to create session');
      }
      currentSession = newSession;
    }

    // 2. Obtener contexto del usuario
    const { data: userStats } = await supabaseClient.rpc('get_development_stats', {
      p_user_id: user_id,
    });

    const { data: skillGaps } = await supabaseClient.rpc('get_skill_gaps', {
      p_user_id: user_id,
    });

    const { data: careerGoals } = await supabaseClient
      .from('career_goals')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active');

    // 3. Generar respuesta del coach
    const coachResponse = generateCoachResponse(
      message,
      (currentSession.conversation_history || []) as ConversationMessage[],
      {
        stats: userStats?.[0] as UserStats | undefined,
        skillGaps: (skillGaps || []) as SkillGap[],
        careerGoals: (careerGoals || []) as CareerGoal[],
      }
    );

    // 4. Actualizar historial de conversacion
    const updatedHistory: ConversationMessage[] = [
      ...((currentSession.conversation_history || []) as ConversationMessage[]),
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: coachResponse.response,
        timestamp: new Date().toISOString(),
      },
    ];

    // 5. Actualizar sesion con nueva conversacion e insights
    const { error: updateError } = await supabaseClient
      .from('ai_coach_sessions')
      .update({
        conversation_history: updatedHistory,
        insights: [
          ...((currentSession.insights || []) as CoachInsight[]),
          ...coachResponse.insights,
        ],
        action_items: [
          ...((currentSession.action_items || []) as CoachActionItem[]),
          ...coachResponse.action_items,
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    return new Response(
      JSON.stringify({
        response: coachResponse.response,
        insights: coachResponse.insights,
        action_items: coachResponse.action_items,
        session_id: currentSession.id,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error in AI career coach:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

function generateCoachResponse(
  message: string,
  conversationHistory: ConversationMessage[],
  userContext: UserContext
): {
  response: string;
  insights: CoachInsight[];
  action_items: CoachActionItem[];
} {
  const messageLower = message.toLowerCase();
  let response = '';
  const insights: CoachInsight[] = [];
  const action_items: CoachActionItem[] = [];

  // Analisis del mensaje del usuario
  if (messageLower.includes('carrera') || messageLower.includes('career')) {
    response = `Veo que tienes ${userContext.careerGoals?.length || 0} objetivos de carrera activos. `;

    if (userContext.skillGaps && userContext.skillGaps.length > 0) {
      const topGap = userContext.skillGaps[0];
      response += `Para avanzar en tu carrera, recomiendo enfocarte en ${topGap.skill_name}, donde tienes un gap de ${topGap.gap} niveles. `;

      insights.push({
        type: 'skill_gap',
        content: `Gap critico en ${topGap.skill_name}`,
        created_at: new Date().toISOString(),
      });

      action_items.push({
        title: `Mejorar ${topGap.skill_name}`,
        description: `Dedicar 2-3 horas semanales a practicar ${topGap.skill_name}`,
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Tienes una buena base de skills. Te recomendaria establecer objetivos de carrera claros para enfocarte. ';
    }

    response += 'Hay algun rol especifico al que aspiras?';
  } else if (messageLower.includes('skill') || messageLower.includes('habilidad')) {
    const stats = userContext.stats;
    response = `Actualmente tienes ${stats?.total_skills || 0} skills registradas con un nivel promedio de ${stats?.avg_skill_level?.toFixed(1) || 0}/5. `;

    if (userContext.skillGaps && userContext.skillGaps.length > 0) {
      response += `Tus top 3 areas de mejora son: ${userContext.skillGaps
        .slice(0, 3)
        .map((g: SkillGap) => g.skill_name)
        .join(', ')}. `;

      insights.push({
        type: 'skill_analysis',
        content: `${userContext.skillGaps.length} skills por mejorar`,
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Te recomendaria agregar nuevas skills a tu matriz para seguir creciendo. ';
    }

    response += 'En que skill te gustaria enfocarte primero?';
  } else if (messageLower.includes('aprender') || messageLower.includes('learn')) {
    response = 'Excelente actitud de aprendizaje. ';

    if (userContext.stats?.learning_paths_active && userContext.stats.learning_paths_active > 0) {
      response += `Tienes ${userContext.stats.learning_paths_active} learning paths activos. Te sugiero completar el actual antes de empezar uno nuevo. `;
    } else {
      response += 'Te recomendaria crear un learning path estructurado. ';

      action_items.push({
        title: 'Crear Learning Path',
        description: 'Definir un camino de aprendizaje con objetivos claros',
        priority: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    response += 'Que te gustaria aprender?';
  } else if (messageLower.includes('feedback')) {
    const stats = userContext.stats;
    response = `Has recibido ${stats?.total_feedback_received || 0} feedback de colegas. `;

    if (stats?.total_feedback_received === 0) {
      response += 'El feedback es crucial para el crecimiento. Te sugiero pedir feedback especifico a tu equipo o manager. ';

      action_items.push({
        title: 'Solicitar Feedback',
        description: 'Pedir feedback especifico a 3 personas del equipo',
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Sigue solicitando feedback regularmente para mejorar continuamente. ';
    }

    response += 'Hay alguna area especifica en la que te gustaria recibir feedback?';
  } else if (messageLower.includes('ayuda') || messageLower.includes('help')) {
    response = `Soy tu AI Career Coach. Puedo ayudarte con:

Analisis de skills y gaps
Definicion de objetivos de carrera
Creacion de learning paths
Consejos de desarrollo profesional
Feedback y mejora continua

En que area te gustaria enfocarte hoy?`;
  } else {
    // Respuesta generica
    response = 'Entiendo tu pregunta. ';

    if (conversationHistory.length === 0) {
      response += 'Es un placer ayudarte en tu desarrollo profesional. ';
    }

    if (userContext.stats?.total_skills === 0) {
      response += 'Para empezar, te recomendaria agregar tus skills actuales a la matriz de desarrollo. ';

      action_items.push({
        title: 'Completar Skills Matrix',
        description: 'Agregar al menos 5 skills con niveles actuales y objetivos',
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    }

    response += 'Puedes darme mas detalles sobre lo que necesitas?';
  }

  return {
    response,
    insights,
    action_items,
  };
}
