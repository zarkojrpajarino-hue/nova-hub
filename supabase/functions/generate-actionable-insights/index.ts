/**
 * GENERATE ACTIONABLE INSIGHTS - Edge Function
 *
 * Analiza datos del usuario y genera insights con acciones ejecutables
 * Cada insight incluye botones para ejecutar acciones inmediatamente
 *
 * Input:
 * - user_id: UUID del usuario
 * - context: Contexto del análisis ('financial', 'okr', 'tasks', 'all')
 *
 * Output:
 * - insights: Array de insights con acciones sugeridas
 * - suggested_actions: Acciones listas para ejecutar
 * - priority_actions: Acciones de alta prioridad
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Insight {
  id: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  impact: string;
  actionable: boolean;
}

interface SuggestedAction {
  source_type: string;
  source_id: string;
  action_type: string;
  title: string;
  description: string;
  priority: string;
  action_data: Record<string, unknown>;
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

    const body = await req.json() as Record<string, unknown>;
    const { user_id, context } = body as { user_id: string; context?: string };

    if (!user_id) {
      throw new Error('user_id is required');
    }

    const analysisContext = context || 'all';

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const insights: Insight[] = [];
    const suggestedActions: SuggestedAction[] = [];

    // 1. FINANCIAL INSIGHTS
    if (analysisContext === 'financial' || analysisContext === 'all') {
      const financialInsights = await analyzeFinancial(supabaseClient, user_id);
      insights.push(...financialInsights.insights);
      suggestedActions.push(...financialInsights.actions);
    }

    // 2. OKR INSIGHTS
    if (analysisContext === 'okr' || analysisContext === 'all') {
      const okrInsights = await analyzeOKRs(supabaseClient, user_id);
      insights.push(...okrInsights.insights);
      suggestedActions.push(...okrInsights.actions);
    }

    // 3. TASKS INSIGHTS
    if (analysisContext === 'tasks' || analysisContext === 'all') {
      const tasksInsights = await analyzeTasks(supabaseClient, user_id);
      insights.push(...tasksInsights.insights);
      suggestedActions.push(...tasksInsights.actions);
    }

    // 4. CRM INSIGHTS
    if (analysisContext === 'crm' || analysisContext === 'all') {
      const crmInsights = await analyzeCRM(supabaseClient, user_id);
      insights.push(...crmInsights.insights);
      suggestedActions.push(...crmInsights.actions);
    }

    // Guardar acciones sugeridas en la base de datos
    for (const action of suggestedActions) {
      await supabaseClient.from('ai_suggested_actions').insert({
        user_id,
        source_type: action.source_type,
        source_id: action.source_id,
        action_type: action.action_type,
        title: action.title,
        description: action.description,
        priority: action.priority,
        action_data: action.action_data,
      });
    }

    // Filtrar acciones prioritarias
    const priorityActions = suggestedActions.filter(
      (a) => a.priority === 'critical' || a.priority === 'high'
    );

    return new Response(
      JSON.stringify({
        insights,
        suggested_actions: suggestedActions,
        priority_actions: priorityActions,
        total_insights: insights.length,
        total_actions: suggestedActions.length,
        generated_at: new Date().toISOString(),
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating actionable insights:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function analyzeFinancial(supabase: SupabaseClient, _userId: string) {
  const insights: Insight[] = [];
  const actions: SuggestedAction[] = [];

  // Obtener salud financiera
  const { data: financialHealth } = await supabase
    .from('financial_health_dashboard')
    .select('*')
    .single();

  if (!financialHealth) {
    return { insights, actions };
  }

  const runway = financialHealth.runway_months || 999;
  const burnRate = financialHealth.avg_monthly_burn || 0;

  // Insight 1: Runway crítico
  if (runway < 6 && burnRate > 0) {
    insights.push({
      id: 'financial_runway_critical',
      category: 'financial',
      severity: 'critical',
      title: 'Runway Crítico',
      message: `Solo ${runway.toFixed(1)} meses de runway restantes`,
      impact: 'high',
      actionable: true,
    });

    actions.push({
      source_type: 'insight',
      source_id: 'financial_runway_critical',
      action_type: 'create_task',
      title: 'Reducir burn rate urgentemente',
      description: `Runway actual: ${runway.toFixed(1)} meses. Burn rate: €${burnRate.toFixed(0)}/mes`,
      priority: 'critical',
      action_data: {
        title: 'Reducir burn rate urgentemente',
        description: `Analizar gastos y reducir burn rate. Runway: ${runway.toFixed(1)} meses`,
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 días
      },
    });

    actions.push({
      source_type: 'insight',
      source_id: 'financial_runway_critical',
      action_type: 'create_okr',
      title: 'Extender runway a 12 meses',
      description: 'Objetivo: Llegar a 12 meses de runway',
      priority: 'critical',
      action_data: {
        title: 'Extender runway a 12 meses',
        target_value: 12,
        unit: 'meses',
        period: 'Q1-2026',
      },
    });
  }

  // Insight 2: Predicción de revenue
  const { data: revenueForecast } = await supabase
    .from('revenue_forecasts')
    .select('*')
    .gte('forecast_date', new Date().toISOString().split('T')[0])
    .order('forecast_date', { ascending: true })
    .limit(1)
    .single();

  if (revenueForecast && revenueForecast.trend === 'declining') {
    insights.push({
      id: 'financial_revenue_declining',
      category: 'financial',
      severity: 'high',
      title: 'Revenue en declive',
      message: `Tendencia negativa: ${revenueForecast.growth_rate_percentage.toFixed(1)}%`,
      impact: 'high',
      actionable: true,
    });

    actions.push({
      source_type: 'insight',
      source_id: 'financial_revenue_declining',
      action_type: 'create_task',
      title: 'Revisar estrategia de pricing',
      description: 'Revenue declining. Analizar pricing y adquisición',
      priority: 'high',
      action_data: {
        title: 'Revisar estrategia de pricing',
        description: `Revenue con tendencia negativa (${revenueForecast.growth_rate_percentage.toFixed(1)}%). Analizar precio y canales de adquisición`,
        priority: 'high',
      },
    });
  }

  return { insights, actions };
}

async function analyzeOKRs(supabase: SupabaseClient, _userId: string) {
  const insights: Insight[] = [];
  const actions: SuggestedAction[] = [];

  // Obtener objetivos en riesgo
  const { data: objectives } = await supabase
    .from('objectives')
    .select('*')
    .eq('status', 'active');

  if (!objectives || objectives.length === 0) {
    return { insights, actions };
  }

  for (const objective of objectives) {
    const progress = objective.metadata?.progress || 0;

    // OKR con progreso bajo
    if (progress < 30) {
      insights.push({
        id: `okr_low_progress_${objective.id}`,
        category: 'okr',
        severity: 'high',
        title: `OKR en riesgo: ${objective.name}`,
        message: `Solo ${progress}% de progreso`,
        impact: 'medium',
        actionable: true,
      });

      actions.push({
        source_type: 'insight',
        source_id: objective.id,
        action_type: 'create_task',
        title: `Acelerar: ${objective.name}`,
        description: `OKR con solo ${progress}% de progreso. Necesita atención inmediata`,
        priority: 'high',
        action_data: {
          title: `Plan de acción: ${objective.name}`,
          description: `Crear plan detallado para acelerar progreso del OKR (actualmente ${progress}%)`,
          priority: 'high',
        },
      });

      actions.push({
        source_type: 'insight',
        source_id: objective.id,
        action_type: 'schedule_meeting',
        title: `Review 1:1 para ${objective.name}`,
        description: 'Agendar 1:1 para revisar blockers',
        priority: 'medium',
        action_data: {
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 días
          agenda: [
            { topic: `Review de OKR: ${objective.name}`, duration: 30 },
            { topic: 'Identificar blockers', duration: 15 },
            { topic: 'Plan de acción', duration: 15 },
          ],
        },
      });
    }
  }

  return { insights, actions };
}

async function analyzeTasks(supabase: SupabaseClient, userId: string) {
  const insights: Insight[] = [];
  const actions: SuggestedAction[] = [];

  // Obtener tareas vencidas
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', userId)
    .neq('status', 'done')
    .lt('due_date', new Date().toISOString());

  if (overdueTasks && overdueTasks.length > 0) {
    insights.push({
      id: 'tasks_overdue',
      category: 'tasks',
      severity: 'medium',
      title: 'Tareas vencidas',
      message: `${overdueTasks.length} tareas pasadas de deadline`,
      impact: 'medium',
      actionable: true,
    });

    // Agrupar tareas vencidas de alta prioridad
    const highPriorityOverdue = overdueTasks.filter((t) => t.priority === 'high');

    if (highPriorityOverdue.length > 0) {
      actions.push({
        source_type: 'insight',
        source_id: 'tasks_overdue',
        action_type: 'create_task',
        title: 'Repriorizar tareas vencidas',
        description: `${highPriorityOverdue.length} tareas de alta prioridad vencidas necesitan atención`,
        priority: 'high',
        action_data: {
          title: 'Repriorizar y completar tareas vencidas',
          description: `Revisar ${highPriorityOverdue.length} tareas de alta prioridad vencidas y reorganizar`,
          priority: 'high',
        },
      });
    }
  }

  return { insights, actions };
}

async function analyzeCRM(supabase: SupabaseClient, _userId: string) {
  const insights: Insight[] = [];
  const actions: SuggestedAction[] = [];

  // Obtener leads sin contacto reciente
  const { data: staleLeads } = await supabase
    .from('leads')
    .select('*')
    .lt('last_contact_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .in('status', ['prospecto', 'contactado', 'cualificado']);

  if (staleLeads && staleLeads.length > 0) {
    insights.push({
      id: 'crm_stale_leads',
      category: 'crm',
      severity: 'medium',
      title: 'Leads sin contacto',
      message: `${staleLeads.length} leads sin contactar hace más de 30 días`,
      impact: 'medium',
      actionable: true,
    });

    // Crear tarea para cada lead de alto valor
    const highValueLeads = staleLeads.filter((l) => (l.valor_potencial || 0) > 10000);

    for (const lead of highValueLeads.slice(0, 3)) {
      // Máximo 3 acciones
      actions.push({
        source_type: 'insight',
        source_id: lead.id,
        action_type: 'create_task',
        title: `Contactar: ${lead.empresa}`,
        description: `Lead de alto valor (€${lead.valor_potencial}) sin contacto hace >30 días`,
        priority: 'high',
        action_data: {
          title: `Follow-up: ${lead.empresa}`,
          description: `Lead sin contacto hace más de 30 días. Valor potencial: €${lead.valor_potencial}`,
          priority: 'high',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 días
        },
      });
    }
  }

  return { insights, actions };
}
