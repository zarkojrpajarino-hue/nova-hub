/**
 * 🎯 APPLY MEETING INSIGHTS - SUPABASE EDGE FUNCTION
 *
 * Aplica insights aprobados al sistema real:
 * - Tareas → tabla tasks
 * - Decisiones → documentadas en meeting_decisions
 * - Leads → tabla leads/CRM
 * - OBVs → actualizar tabla obvs
 * - Blockers → tareas urgentes
 * - Métricas → registro de métricas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MeetingRecord extends Record<string, unknown> {
  id: string;
  project_id: string;
  created_by: string;
  notas?: string;
}

interface InsightRecord extends Record<string, unknown> {
  id: string;
  insight_type: string;
  content: Record<string, unknown>;
}


serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Handle CORS preflight
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // 1. Validar request
    const { meetingId } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'meetingId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('🎯 Applying insights for meeting:', meetingId);

    // 2. Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const { serviceClient: supabase } = await validateAuth(req);

    // 3. Obtener reunión
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 4. Obtener insights aprobados
    const { data: insights, error: insightsError } = await supabase
      .from('meeting_insights')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('review_status', 'approved')
      .eq('applied', false);

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch insights' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    if (!insights || insights.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No approved insights to apply' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log(`✅ Found ${insights.length} approved insights to apply`);

    // 5. Aplicar cada insight según su tipo
    const results = {
      tasks: 0,
      decisions: 0,
      leads: 0,
      obv_updates: 0,
      blockers: 0,
      metrics: 0,
      errors: [] as string[],
    };

    for (const insight of insights) {
      try {
        let appliedEntityId: string | null = null;

        switch (insight.insight_type) {
          case 'task':
            appliedEntityId = await applyTask(supabase, meeting, insight);
            if (appliedEntityId) results.tasks++;
            break;

          case 'decision':
            appliedEntityId = await applyDecision(supabase, meeting, insight);
            if (appliedEntityId) results.decisions++;
            break;

          case 'lead':
            appliedEntityId = await applyLead(supabase, meeting, insight);
            if (appliedEntityId) results.leads++;
            break;

          case 'obv_update':
            appliedEntityId = await applyOBVUpdate(supabase, meeting, insight);
            if (appliedEntityId) results.obv_updates++;
            break;

          case 'blocker':
            appliedEntityId = await applyBlocker(supabase, meeting, insight);
            if (appliedEntityId) results.blockers++;
            break;

          case 'metric':
            appliedEntityId = await applyMetric(supabase, meeting, insight);
            if (appliedEntityId) results.metrics++;
            break;

          default:
            console.warn('Unknown insight type:', insight.insight_type);
        }

        // Marcar insight como aplicado
        if (appliedEntityId) {
          await supabase
            .from('meeting_insights')
            .update({
              applied: true,
              applied_entity_id: appliedEntityId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', insight.id);
        }
      } catch (error) {
            if (error instanceof Response) return error;
console.error(`Error applying insight ${insight.id}:`, error);
        results.errors.push(`${insight.insight_type}: ${(error as Error).message}`);
      }
    }

    // 6. Actualizar estado de la reunión
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting status:', updateError);
    }

    console.log('✅ Insights applied successfully:', results);

    // 7. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        results,
        message: 'Insights applied successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

/**
 * Aplica una tarea al sistema
 */
async function applyTask(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    title: string;
    description?: string;
    priority?: string;
    estimated_hours?: number;
    deadline?: string;
    assigned_to?: string;
  };

  const taskData = {
    proyecto_id: meeting.project_id,
    titulo: content.title,
    descripcion: content.description || '',
    prioridad: mapPriority(content.priority),
    estado: 'pending',
    horas_estimadas: content.estimated_hours || null,
    fecha_limite: content.deadline || null,
    asignado_a: content.assigned_to || null,
    creado_por: meeting.created_by,
    // Metadata adicional
    meeting_id: meeting.id,
    source: 'meeting_intelligence',
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  console.log(`✅ Task created: ${data.id}`);
  return data.id;
}

/**
 * Aplica una decisión al sistema
 */
async function applyDecision(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    impact?: string;
    title?: string;
    description?: string;
    rationale?: string;
  };

  // Las decisiones ya están en meeting_decisions (se crearon en Task #45)
  // Aquí solo las marcamos como "applied" si necesitamos hacer algo adicional

  // Podrías crear una tarea de seguimiento si la decisión requiere implementación
  if (content.impact === 'alto' || content.impact === 'crítico') {
    const followUpTask = {
      proyecto_id: meeting.project_id,
      titulo: `Implementar decisión: ${content.title}`,
      descripcion: `${content.description}\n\nRazón: ${content.rationale || 'N/A'}`,
      prioridad: 'alta',
      estado: 'pending',
      creado_por: meeting.created_by,
      meeting_id: meeting.id,
      source: 'meeting_intelligence',
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(followUpTask)
      .select()
      .single();

    if (error) {
      console.error('Error creating decision follow-up task:', error);
      throw error;
    }

    console.log(`✅ Decision follow-up task created: ${data.id}`);
    return data.id;
  }

  return insight.id; // Si no crea nada, devolver el insight ID
}

/**
 * Aplica un lead al sistema
 */
async function applyLead(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    company_name?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    opportunity?: string;
    estimated_value?: number;
    stage?: string;
  };

  // Verificar si existe tabla de leads
  const { data: tableExists } = await supabase
    .from('leads')
    .select('id')
    .limit(1);

  if (tableExists !== null) {
    // Tabla existe, crear lead
    const leadData = {
      project_id: meeting.project_id,
      company_name: content.company_name,
      contact_name: content.contact_name,
      contact_email: content.contact_email,
      contact_phone: content.contact_phone,
      opportunity: content.opportunity,
      estimated_value: content.estimated_value,
      stage: content.stage || 'prospecto',
      source: 'meeting_intelligence',
      meeting_id: meeting.id,
      created_by: meeting.created_by,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw error;
    }

    console.log(`✅ Lead created: ${data.id}`);
    return data.id;
  } else {
    // Si no existe tabla de leads, crear una tarea para seguimiento
    const leadTask = {
      proyecto_id: meeting.project_id,
      titulo: `Lead: ${content.company_name}`,
      descripcion: `Oportunidad: ${content.opportunity}\nContacto: ${content.contact_name}\nEmail: ${content.contact_email || 'N/A'}\nValor estimado: €${content.estimated_value || 0}`,
      prioridad: 'alta',
      estado: 'pending',
      creado_por: meeting.created_by,
      meeting_id: meeting.id,
      source: 'meeting_intelligence',
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(leadTask)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead task:', error);
      throw error;
    }

    console.log(`✅ Lead task created: ${data.id}`);
    return data.id;
  }
}

/**
 * Aplica actualización de OBV
 */
async function applyOBVUpdate(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    obv_id?: string;
    obv_title?: string;
    description?: string;
    update_type?: string;
  };

  // Obtener el OBV
  const { data: obvRaw, error: obvError } = await supabase
    .from('obvs')
    .select('*')
    .eq('id', content.obv_id)
    .single();
  const obv = obvRaw as { notas?: string } | null;

  if (obvError || !obv) {
    console.error('OBV not found:', content.obv_id);
    // Crear tarea en su lugar
    const obvTask = {
      proyecto_id: meeting.project_id,
      titulo: `Actualizar OBV: ${content.obv_title}`,
      descripcion: content.description,
      prioridad: 'media',
      estado: 'pending',
      creado_por: meeting.created_by,
      meeting_id: meeting.id,
      source: 'meeting_intelligence',
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(obvTask)
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  // Actualizar el OBV según el tipo de update
  let updateData: Record<string, unknown> = {};

  switch (content.update_type) {
    case 'progreso':
      // Añadir nota de progreso
      updateData = {
        notas: `${obv.notas || ''}\n\n[${new Date().toLocaleDateString()}] ${content.description}`,
      };
      break;

    case 'blocker':
      // Marcar como bloqueado y añadir nota
      updateData = {
        estado: 'en_riesgo',
        notas: `${obv.notas || ''}\n\n[BLOCKER] ${content.description}`,
      };
      break;

    case 'completado':
      // Marcar como completado
      updateData = {
        estado: 'completado',
        fecha_completado: new Date().toISOString(),
        notas: `${obv.notas || ''}\n\n[COMPLETADO] ${content.description}`,
      };
      break;

    case 'ajuste':
      // Solo añadir nota de ajuste
      updateData = {
        notas: `${obv.notas || ''}\n\n[AJUSTE] ${content.description}`,
      };
      break;
  }

  const { error: updateError } = await supabase
    .from('obvs')
    .update(updateData)
    .eq('id', content.obv_id);

  if (updateError) {
    console.error('Error updating OBV:', updateError);
    throw updateError;
  }

  console.log(`✅ OBV updated: ${content.obv_id}`);
  return content.obv_id;
}

/**
 * Aplica un blocker al sistema (crea tarea urgente)
 */
async function applyBlocker(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    title?: string;
    description?: string;
    affected_areas?: string[];
    suggested_solution?: string;
    severity?: string;
  };

  const blockerTask = {
    proyecto_id: meeting.project_id,
    titulo: `🚨 BLOCKER: ${content.title}`,
    descripcion: `${content.description}\n\nÁreas afectadas: ${content.affected_areas?.join(', ') || 'N/A'}\n\nSolución sugerida: ${content.suggested_solution || 'N/A'}`,
    prioridad: content.severity === 'crítico' ? 'critica' : 'alta',
    estado: 'pending',
    creado_por: meeting.created_by,
    meeting_id: meeting.id,
    source: 'meeting_intelligence',
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(blockerTask)
    .select()
    .single();

  if (error) {
    console.error('Error creating blocker task:', error);
    throw error;
  }

  console.log(`✅ Blocker task created: ${data.id}`);
  return data.id;
}

/**
 * Aplica una métrica al sistema
 */
async function applyMetric(supabase: SupabaseClient, meeting: MeetingRecord, insight: InsightRecord): Promise<string | null> {
  const content = insight.content as {
    name?: string;
    value?: number;
    unit?: string;
    trend?: string;
    context?: string;
    action_required?: string;
  };

  // Verificar si existe tabla de métricas
  const { data: tableExists } = await supabase
    .from('metrics')
    .select('id')
    .limit(1);

  if (tableExists !== null) {
    // Tabla existe, registrar métrica
    const metricData = {
      project_id: meeting.project_id,
      name: content.name,
      value: content.value,
      unit: content.unit,
      trend: content.trend,
      recorded_at: new Date().toISOString(),
      source: 'meeting_intelligence',
      meeting_id: meeting.id,
      context: content.context,
    };

    const { data, error } = await supabase
      .from('metrics')
      .insert(metricData)
      .select()
      .single();

    if (error) {
      console.error('Error recording metric:', error);
      throw error;
    }

    console.log(`✅ Metric recorded: ${data.id}`);
    return data.id;
  } else {
    // Si no existe tabla, crear tarea si requiere acción
    if (content.action_required) {
      const metricTask = {
        proyecto_id: meeting.project_id,
        titulo: `📊 Métrica: ${content.name}`,
        descripcion: `Valor: ${content.value} ${content.unit}\nTendencia: ${content.trend}\n\nAcción requerida: ${content.action_required}`,
        prioridad: 'media',
        estado: 'pending',
        creado_por: meeting.created_by,
        meeting_id: meeting.id,
        source: 'meeting_intelligence',
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(metricTask)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    }

    return insight.id; // Si no requiere acción, devolver insight ID
  }
}

/**
 * Mapea prioridad de texto a enum de BD
 */
function mapPriority(priority: string): string {
  const map: Record<string, string> = {
    'baja': 'baja',
    'media': 'media',
    'alta': 'alta',
    'crítica': 'critica',
    'critica': 'critica',
  };

  return map[priority?.toLowerCase()] || 'media';
}
