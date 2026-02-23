/**
 * PREPARE ONE-ON-ONE - Edge Function
 *
 * Prepara automáticamente agendas para reuniones 1:1 usando IA
 * Analiza:
 * - Tareas completadas desde último 1:1
 * - Objetivos de carrera en progreso
 * - Skills en desarrollo
 * - Feedback reciente
 *
 * Input:
 * - user_id: UUID del usuario
 * - meeting_id: ID del 1:1 (opcional, crea nuevo si no existe)
 * - with_user_id: ID de la persona con quien es el 1:1
 * - scheduled_date: Fecha programada
 *
 * Output:
 * - meeting_id: ID del 1:1 creado/actualizado
 * - agenda: Agenda generada automáticamente
 * - talking_points: Puntos clave a discutir
 * - wins: Logros recientes
 * - challenges: Desafíos identificados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';

interface CompletedTask {
  titulo?: string;
  priority?: string;
  completed_at?: string;
}

interface LearningPath {
  title?: string;
  progress_percentage?: number;
  learning_path_steps?: unknown[];
}

interface CareerGoal {
  title?: string;
  progress_percentage?: number;
}

interface PeerFeedback {
  feedback_type?: string;
  created_at?: string;
}

interface SkillGap {
  skill_name?: string;
  current_level?: number;
  target_level?: number;
}

interface AgendaItem {
  order: number;
  title: string;
  duration_minutes: number;
  topics: string[];
}

interface WinItem {
  category: string;
  title: string;
  details?: string;
}

interface TalkingPoint {
  category: string;
  question: string;
  context: string;

}

interface PrepResult {
  agenda: AgendaItem[];
  wins: WinItem[];
  challenges: WinItem[];
  talking_points: TalkingPoint[];
  summary: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, meeting_id, with_user_id, scheduled_date } = await req.json();

    if (!user_id || !scheduled_date) {
      throw new Error('user_id and scheduled_date are required');
    }

    // Initialize Supabase client
        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    // 1. Obtener último 1:1 para comparar progreso
    const { data: lastMeeting } = await supabaseClient
      .from('one_on_one_meetings')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
      .limit(1)
      .single();

    const sinceDate = lastMeeting?.scheduled_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Obtener tareas completadas desde último 1:1
    const { data: completedTasks } = await supabaseClient
      .from('tasks')
      .select('titulo, priority, completed_at')
      .eq('assignee_id', user_id)
      .eq('status', 'done')
      .gte('completed_at', sinceDate);

    // 3. Obtener progreso en learning paths
    const { data: learningPaths } = await supabaseClient
      .from('learning_paths')
      .select('*, learning_path_steps(*)')
      .eq('user_id', user_id)
      .eq('status', 'active');

    // 4. Obtener objetivos de carrera
    const { data: careerGoals } = await supabaseClient
      .from('career_goals')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active');

    // 5. Obtener feedback reciente
    const { data: recentFeedback } = await supabaseClient
      .from('peer_feedback')
      .select('*')
      .eq('to_user_id', user_id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false });

    // 6. Obtener skill gaps
    const { data: skillGaps } = await supabaseClient.rpc('get_skill_gaps', {
      p_user_id: user_id,
    });

    // 7. Generar agenda con IA
    const prep = generateOneOnOnePrep({
      completedTasks: completedTasks || [],
      learningPaths: learningPaths || [],
      careerGoals: careerGoals || [],
      recentFeedback: recentFeedback || [],
      skillGaps: skillGaps || [],
      sinceDate,
    });

    // 8. Crear o actualizar 1:1
    let currentMeeting;
    if (meeting_id) {
      const { data, error } = await supabaseClient
        .from('one_on_one_meetings')
        .update({
          agenda: prep.agenda,
          ai_prep_generated: true,
          ai_prep_data: prep,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meeting_id)
        .select()
        .single();

      if (error) throw error;
      currentMeeting = data;
    } else {
      const { data, error } = await supabaseClient
        .from('one_on_one_meetings')
        .insert({
          user_id,
          with_user_id,
          scheduled_date,
          agenda: prep.agenda,
          ai_prep_generated: true,
          ai_prep_data: prep,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      currentMeeting = data;
    }

    return new Response(
      JSON.stringify({
        meeting_id: currentMeeting.id,
        meeting: currentMeeting,
        prep,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error preparing 1:1:', error);
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

function generateOneOnOnePrep(data: {
  completedTasks: CompletedTask[];
  learningPaths: LearningPath[];
  careerGoals: CareerGoal[];
  recentFeedback: PeerFeedback[];
  skillGaps: SkillGap[];
  sinceDate: string;
}): PrepResult {
  const agenda: AgendaItem[] = [];
  const wins: WinItem[] = [];
  const challenges: WinItem[] = [];
  const talking_points: TalkingPoint[] = [];

  // 1. WINS - Logros recientes
  if (data.completedTasks.length > 0) {
    const highPriorityTasks = data.completedTasks.filter((t) => t.priority === 'high');
    wins.push({
      category: 'tasks',
      title: `${data.completedTasks.length} tareas completadas`,
      details: highPriorityTasks.length > 0
        ? `Incluyendo ${highPriorityTasks.length} tareas de alta prioridad`
        : undefined,
    });

    agenda.push({
      order: 1,
      title: '🎯 Wins & Accomplishments',
      duration_minutes: 10,
      topics: [
        `Tareas completadas: ${data.completedTasks.length}`,
        ...(highPriorityTasks.length > 0
          ? [`✨ ${highPriorityTasks.length} tareas de alta prioridad`]
          : []),
      ],
    });
  }

  // 2. LEARNING PROGRESS
  if (data.learningPaths.length > 0) {
    const pathsWithProgress = data.learningPaths.filter((lp) => lp.progress_percentage > 0);

    if (pathsWithProgress.length > 0) {
      wins.push({
        category: 'learning',
        title: `Progreso en ${pathsWithProgress.length} learning paths`,
        details: pathsWithProgress.map((lp: LearningPath) =>
          `${lp.title}: ${lp.progress_percentage}%`
        ).join(', '),
      });
    }

    agenda.push({
      order: 2,
      title: '📚 Learning & Development',
      duration_minutes: 10,
      topics: data.learningPaths.map((lp: LearningPath) =>
        `${lp.title} (${lp.progress_percentage}% completado)`
      ),
    });

    talking_points.push({
      category: 'learning',
      question: '¿Hay algún obstáculo en tu learning path actual?',
      context: 'Para identificar blockers y ofrecer support',
    });
  }

  // 3. CAREER GOALS
  if (data.careerGoals.length > 0) {
    agenda.push({
      order: 3,
      title: '🎯 Career Goals',
      duration_minutes: 15,
      topics: data.careerGoals.map((cg: CareerGoal) =>
        `${cg.title} (${cg.progress_percentage}% hacia objetivo)`
      ),
    });

    const lowProgressGoals = data.careerGoals.filter((cg: CareerGoal) => (cg.progress_percentage ?? 0) < 30);
    if (lowProgressGoals.length > 0) {
      challenges.push({
        category: 'career',
        title: `${lowProgressGoals.length} objetivos con poco progreso`,
        details: 'Necesitan atención o posible re-evaluación',
      });

      talking_points.push({
        category: 'career',
        question: '¿Qué te está bloqueando en tus objetivos de carrera?',
        context: 'Para identificar y remover blockers',
      });
    }
  }

  // 4. SKILL GAPS
  if (data.skillGaps.length > 0) {
    const topGaps = data.skillGaps.slice(0, 3);
    challenges.push({
      category: 'skills',
      title: `${data.skillGaps.length} skill gaps identificados`,
      details: `Top 3: ${topGaps.map((sg: SkillGap) => sg.skill_name).join(', ')}`,
    });

    agenda.push({
      order: 4,
      title: '🔧 Skill Development',
      duration_minutes: 10,
      topics: [
        'Skill gaps actuales',
        ...topGaps.map((sg: SkillGap) =>
          `${sg.skill_name}: nivel ${sg.current_level} → ${sg.target_level}`
        ),
      ],
    });

    talking_points.push({
      category: 'skills',
      question: `¿Cómo puedo ayudarte a mejorar en ${topGaps[0]?.skill_name}?`,
      context: 'Para ofrecer recursos, mentorship o proyectos',
    });
  }

  // 5. FEEDBACK
  if (data.recentFeedback.length > 0) {
    const positiveFeedback = data.recentFeedback.filter((f) => f.feedback_type === 'positive');
    const constructiveFeedback = data.recentFeedback.filter((f) => f.feedback_type === 'constructive');

    if (positiveFeedback.length > 0) {
      wins.push({
        category: 'feedback',
        title: `${positiveFeedback.length} feedback positivo recibido`,
        details: 'Reconocimiento del equipo',
      });
    }

    if (constructiveFeedback.length > 0) {
      agenda.push({
        order: 5,
        title: '💬 Feedback & Growth Areas',
        duration_minutes: 10,
        topics: [
          `${constructiveFeedback.length} áreas de mejora identificadas`,
          'Plan de acción para feedback constructivo',
        ],
      });
    }
  }

  // 6. WELLBEING & BLOCKERS
  agenda.push({
    order: 6,
    title: '🌟 Wellbeing & Blockers',
    duration_minutes: 10,
    topics: [
      '¿Cómo te sientes con tu carga de trabajo?',
      '¿Hay algo bloqueando tu productividad?',
      '¿Necesitas algún tipo de support?',
    ],
  });

  talking_points.push({
    category: 'wellbeing',
    question: '¿Cómo está tu work-life balance?',
    context: 'Check-in de bienestar general',
  });

  // 7. ACTION ITEMS FROM LAST 1:1
  agenda.push({
    order: 7,
    title: '✅ Action Items & Next Steps',
    duration_minutes: 5,
    topics: [
      'Review de action items del último 1:1',
      'Nuevos action items para próximo período',
    ],
  });

  return {
    agenda,
    wins,
    challenges,
    talking_points,
    summary: generateSummary(wins, challenges, data),
  };
}

function generateSummary(wins: WinItem[], challenges: WinItem[], data: {
  completedTasks: CompletedTask[];
  learningPaths: LearningPath[];
  careerGoals: CareerGoal[];
  recentFeedback: PeerFeedback[];
}): string {
  let summary = '📋 **Resumen del período:**\n\n';

  if (wins.length > 0) {
    summary += '**Logros:**\n';
    wins.forEach((win) => {
      summary += `- ${win.title}\n`;
    });
    summary += '\n';
  }

  if (challenges.length > 0) {
    summary += '**Áreas de atención:**\n';
    challenges.forEach((challenge) => {
      summary += `- ${challenge.title}\n`;
    });
    summary += '\n';
  }

  summary += `**Métricas:**\n`;
  summary += `- Tareas completadas: ${data.completedTasks.length}\n`;
  summary += `- Learning paths activos: ${data.learningPaths.length}\n`;
  summary += `- Objetivos de carrera: ${data.careerGoals.length}\n`;
  summary += `- Feedback recibido: ${data.recentFeedback.length}\n`;

  return summary;
}
