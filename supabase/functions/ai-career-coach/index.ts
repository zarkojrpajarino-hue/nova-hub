/**
 * AI CAREER COACH - Edge Function
 *
 * Coach de IA conversacional para desarrollo de carrera
 * Proporciona consejos personalizados basados en:
 * - Skills actuales del usuario
 * - Objetivos de carrera
 * - Historial de conversación
 *
 * Input:
 * - user_id: UUID del usuario
 * - message: Mensaje del usuario
 * - session_id: ID de sesión (opcional, crea nueva si no existe)
 * - topic: Tema de la conversación (opcional)
 *
 * Output:
 * - response: Respuesta del coach
 * - insights: Insights generados
 * - action_items: Acciones sugeridas
 * - session_id: ID de la sesión
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { user_id, message, session_id, topic } = await req.json();

    if (!user_id || !message) {
      throw new Error('user_id and message are required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtener o crear sesión
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
      // Crear nueva sesión
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
      currentSession.conversation_history || [],
      {
        stats: userStats?.[0],
        skillGaps: skillGaps || [],
        careerGoals: careerGoals || [],
      }
    );

    // 4. Actualizar historial de conversación
    const updatedHistory = [
      ...(currentSession.conversation_history || []),
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

    // 5. Actualizar sesión con nueva conversación e insights
    const { error: updateError } = await supabaseClient
      .from('ai_coach_sessions')
      .update({
        conversation_history: updatedHistory,
        insights: [
          ...(currentSession.insights || []),
          ...coachResponse.insights,
        ],
        action_items: [
          ...(currentSession.action_items || []),
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
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in AI career coach:', error);
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

function generateCoachResponse(
  message: string,
  conversationHistory: any[],
  userContext: any
): {
  response: string;
  insights: any[];
  action_items: any[];
} {
  const messageLower = message.toLowerCase();
  let response = '';
  const insights: any[] = [];
  const action_items: any[] = [];

  // Análisis del mensaje del usuario
  if (messageLower.includes('carrera') || messageLower.includes('career')) {
    response = `Veo que tienes ${userContext.careerGoals?.length || 0} objetivos de carrera activos. `;

    if (userContext.skillGaps && userContext.skillGaps.length > 0) {
      const topGap = userContext.skillGaps[0];
      response += `Para avanzar en tu carrera, recomiendo enfocarte en ${topGap.skill_name}, donde tienes un gap de ${topGap.gap} niveles. `;

      insights.push({
        type: 'skill_gap',
        content: `Gap crítico en ${topGap.skill_name}`,
        created_at: new Date().toISOString(),
      });

      action_items.push({
        title: `Mejorar ${topGap.skill_name}`,
        description: `Dedicar 2-3 horas semanales a practicar ${topGap.skill_name}`,
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Tienes una buena base de skills. Te recomendaría establecer objetivos de carrera claros para enfocarte. ';
    }

    response += '¿Hay algún rol específico al que aspiras?';
  } else if (messageLower.includes('skill') || messageLower.includes('habilidad')) {
    const stats = userContext.stats;
    response = `Actualmente tienes ${stats?.total_skills || 0} skills registradas con un nivel promedio de ${stats?.avg_skill_level?.toFixed(1) || 0}/5. `;

    if (userContext.skillGaps && userContext.skillGaps.length > 0) {
      response += `Tus top 3 areas de mejora son: ${userContext.skillGaps
        .slice(0, 3)
        .map((g: any) => g.skill_name)
        .join(', ')}. `;

      insights.push({
        type: 'skill_analysis',
        content: `${userContext.skillGaps.length} skills por mejorar`,
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Te recomendaría agregar nuevas skills a tu matriz para seguir creciendo. ';
    }

    response += '¿En qué skill te gustaría enfocarte primero?';
  } else if (messageLower.includes('aprender') || messageLower.includes('learn')) {
    response = 'Excelente actitud de aprendizaje. ';

    if (userContext.stats?.learning_paths_active > 0) {
      response += `Tienes ${userContext.stats.learning_paths_active} learning paths activos. Te sugiero completar el actual antes de empezar uno nuevo. `;
    } else {
      response += 'Te recomendaría crear un learning path estructurado. ';

      action_items.push({
        title: 'Crear Learning Path',
        description: 'Definir un camino de aprendizaje con objetivos claros',
        priority: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    response += '¿Qué te gustaría aprender?';
  } else if (messageLower.includes('feedback')) {
    const stats = userContext.stats;
    response = `Has recibido ${stats?.total_feedback_received || 0} feedback de colegas. `;

    if (stats?.total_feedback_received === 0) {
      response += 'El feedback es crucial para el crecimiento. Te sugiero pedir feedback específico a tu equipo o manager. ';

      action_items.push({
        title: 'Solicitar Feedback',
        description: 'Pedir feedback específico a 3 personas del equipo',
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    } else {
      response += 'Sigue solicitando feedback regularmente para mejorar continuamente. ';
    }

    response += '¿Hay algún área específica en la que te gustaría recibir feedback?';
  } else if (messageLower.includes('ayuda') || messageLower.includes('help')) {
    response = `Soy tu AI Career Coach. Puedo ayudarte con:

📊 Análisis de skills y gaps
🎯 Definición de objetivos de carrera
📚 Creación de learning paths
💡 Consejos de desarrollo profesional
🔄 Feedback y mejora continua

¿En qué área te gustaría enfocarte hoy?`;
  } else {
    // Respuesta genérica
    response = 'Entiendo tu pregunta. ';

    if (conversationHistory.length === 0) {
      response += 'Es un placer ayudarte en tu desarrollo profesional. ';
    }

    if (userContext.stats?.total_skills === 0) {
      response += 'Para empezar, te recomendaría agregar tus skills actuales a la matriz de desarrollo. ';

      action_items.push({
        title: 'Completar Skills Matrix',
        description: 'Agregar al menos 5 skills con niveles actuales y objetivos',
        priority: 'high',
        created_at: new Date().toISOString(),
      });
    }

    response += '¿Puedes darme más detalles sobre lo que necesitas?';
  }

  return {
    response,
    insights,
    action_items,
  };
}
