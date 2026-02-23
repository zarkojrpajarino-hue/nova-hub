/**
 * SUGGEST OPTIMAL SCHEDULE - Edge Function
 *
 * Analiza patrones de trabajo del usuario y sugiere horarios óptimos para tareas
 * Usa IA para generar recomendaciones personalizadas
 *
 * Input:
 * - user_id: UUID del usuario
 * - task_ids: Array de IDs de tareas para programar
 * - date_range: { start_date, end_date } (opcional)
 *
 * Output:
 * - suggestions: Array de sugerencias con horarios óptimos
 * - reasoning: Explicación de por qué se sugieren esos horarios
 * - patterns: Resumen de patrones detectados del usuario
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface TaskData {
  id: string;
  titulo: string;
  priority?: string;
  estimated_duration_minutes?: number;
  due_date?: string;
}

interface ScheduleSuggestion {
  task_id: string;
  task_title: string;
  suggested_date: string;
  suggested_start_time: string;
  suggested_duration_minutes: number;
  confidence_score: number;
  reasoning: string;
}

interface ProductivityPattern {
  most_productive_hours: number[];
  most_productive_days: number[];
  avg_tasks_per_day: number;
  preferred_task_types: { [key: string]: number };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, task_ids, date_range } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Initialize Supabase client
        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    const rateLimitResult = await checkRateLimit(user_id, 'suggest-optimal-schedule', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // 1. Obtener patrones de productividad del usuario
    const { data: productiveHours, error: _hoursError } = await supabaseClient
      .rpc('get_user_productive_hours', { p_user_id: user_id });

    const { data: productiveDays, error: _daysError } = await supabaseClient
      .rpc('get_user_productive_days', { p_user_id: user_id });

    // 2. Obtener preferencias del usuario
    const { data: preferences } = await supabaseClient
      .from('scheduling_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Si no hay preferencias, usar defaults
    const userPrefs = preferences || {
      work_start_hour: 9,
      work_end_hour: 18,
      work_days: [1, 2, 3, 4, 5],
      deep_work_blocks: [],
    };

    // 3. Obtener las tareas a programar
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('id, titulo, priority, due_date, metadata')
      .in('id', task_ids || []);

    if (tasksError || !tasks || tasks.length === 0) {
      throw new Error('No tasks found to schedule');
    }

    // 4. Analizar patrones
    const patterns: ProductivityPattern = analyzePatterns(
      productiveHours || [],
      productiveDays || []
    );

    // 5. Generar sugerencias
    const suggestions = generateScheduleSuggestions(
      tasks,
      patterns,
      userPrefs,
      date_range
    );

    // 6. Guardar sugerencias en la base de datos
    for (const suggestion of suggestions) {
      await supabaseClient.from('scheduling_suggestions').insert({
        user_id,
        task_id: suggestion.task_id,
        suggested_date: suggestion.suggested_date,
        suggested_start_time: suggestion.suggested_start_time,
        suggested_duration_minutes: suggestion.suggested_duration_minutes,
        confidence_score: suggestion.confidence_score,
        reasoning: suggestion.reasoning,
        status: 'pending',
      });
    }

    return new Response(
      JSON.stringify({
        suggestions,
        patterns,
        preferences: userPrefs,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error generating schedule suggestions:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

function analyzePatterns(
  productiveHours: unknown[],
  productiveDays: unknown[]
): ProductivityPattern {
  // Extraer top 3 horas más productivas
  const topHours = productiveHours
    .sort((a, b) => b.productivity_score - a.productivity_score)
    .slice(0, 3)
    .map((h) => h.hour_of_day);

  // Extraer top 3 días más productivos
  const topDays = productiveDays
    .sort((a, b) => b.productivity_score - a.productivity_score)
    .slice(0, 3)
    .map((d) => d.day_of_week);

  return {
    most_productive_hours: topHours,
    most_productive_days: topDays,
    avg_tasks_per_day:
      productiveDays.reduce((sum, d) => sum + d.tasks_completed, 0) /
      (productiveDays.length || 1),
    preferred_task_types: {},
  };
}

function generateScheduleSuggestions(
  tasks: TaskData[],
  patterns: ProductivityPattern,
  preferences: unknown,
  dateRange?: { start_date: string; end_date: string }
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = [];
  const startDate = dateRange?.start_date
    ? new Date(dateRange.start_date)
    : new Date();
  const endDate = dateRange?.end_date
    ? new Date(dateRange.end_date)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 días

  // Ordenar tareas por prioridad
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
    return bPriority - aPriority;
  });

  const currentDate = new Date(startDate);
  let taskIndex = 0;

  while (taskIndex < sortedTasks.length && currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Solo programar en días laborales
    if (preferences.work_days.includes(dayOfWeek)) {
      const task = sortedTasks[taskIndex];

      // Determinar mejor hora según prioridad y patrones
      let suggestedHour: number;
      let reasoning: string;
      let confidenceScore: number;

      if (task.priority === 'high' && patterns.most_productive_hours.length > 0) {
        // Tareas alta prioridad → horarios más productivos
        suggestedHour = patterns.most_productive_hours[0];
        reasoning = `Tarea de alta prioridad programada en tu hora más productiva (${suggestedHour}:00h) según tus patrones de trabajo.`;
        confidenceScore = 0.95;
      } else if (patterns.most_productive_hours.length > 1) {
        // Tareas media/baja → segundo mejor horario
        suggestedHour = patterns.most_productive_hours[1] || preferences.work_start_hour;
        reasoning = `Programada en horario de buena productividad (${suggestedHour}:00h) basado en tu historial.`;
        confidenceScore = 0.75;
      } else {
        // Default: inicio de jornada
        suggestedHour = preferences.work_start_hour;
        reasoning = `Programada al inicio de tu jornada laboral (${suggestedHour}:00h).`;
        confidenceScore = 0.60;
      }

      // Duración estimada
      const estimatedDuration =
        task.estimated_duration_minutes ||
        (task.priority === 'high' ? 90 : task.priority === 'medium' ? 60 : 30);

      suggestions.push({
        task_id: task.id,
        task_title: task.titulo,
        suggested_date: currentDate.toISOString().split('T')[0],
        suggested_start_time: `${suggestedHour.toString().padStart(2, '0')}:00:00`,
        suggested_duration_minutes: estimatedDuration,
        confidence_score: confidenceScore,
        reasoning,
      });

      taskIndex++;
    }

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return suggestions;
}
