/**
 * 🤖 ANALYZE MEETING - SUPABASE EDGE FUNCTION
 *
 * Analiza transcripciones de reuniones usando GPT-4 para extraer insights:
 * - Tareas con asignados
 * - Decisiones tomadas
 * - Leads/oportunidades
 * - OBVs mencionados
 * - Blockers detectados
 * - Métricas discutidas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectMember {
  id: string;
  nombre: string;
  rol: string;
  email?: string;
}

interface ProjectOBV {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
}

interface MeetingParticipant {
  member_id: string;
  attended?: boolean;
  can_receive_tasks?: boolean;
}

interface MeetingContext {
  meeting: Record<string, unknown>;
  projectMembers: ProjectMember[];
  projectOBVs: ProjectOBV[];
  strategicContext: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar request
    const { meetingId } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'meetingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Starting analysis for meeting:', meetingId);

    // 2. Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Obtener datos de la reunión
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!meeting.transcript) {
      return new Response(
        JSON.stringify({ error: 'Meeting has no transcript' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Meeting loaded, transcript length:', meeting.transcript.length);

    // 4. Obtener contexto del proyecto
    const { data: projectMembers } = await supabase
      .from('members')
      .select('id, nombre, rol, email')
      .eq('project_id', meeting.project_id);

    const { data: projectOBVs } = await supabase
      .from('obvs')
      .select('id, titulo, descripcion, estado')
      .eq('proyecto_id', meeting.project_id)
      .eq('activo', true);

    // 5. Obtener participantes de la reunión
    const { data: participants } = await supabase
      .from('meeting_participants')
      .select('member_id, attended, can_receive_tasks')
      .eq('meeting_id', meetingId);

    console.log('✅ Context loaded:', {
      members: projectMembers?.length || 0,
      obvs: projectOBVs?.length || 0,
      participants: participants?.length || 0,
    });

    // 6. Construir contexto para GPT-4
    const context: MeetingContext = {
      meeting: meeting as Record<string, unknown>,
      projectMembers: (projectMembers || []) as ProjectMember[],
      projectOBVs: (projectOBVs || []) as ProjectOBV[],
      strategicContext: (meeting.strategic_context as Record<string, unknown>) || {},
    };

    // 7. Obtener API key de OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Crear prompt para GPT-4
    const prompt = buildAnalysisPrompt(context, participants || []);

    console.log('🤖 Calling GPT-4 for analysis...');

    // 9. Llamar a GPT-4
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modelo más reciente y económico
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en análisis de reuniones de negocios y equipos de producto. Tu tarea es extraer insights accionables de transcripciones de reuniones.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baja temperatura para respuestas más precisas
        response_format: { type: 'json_object' }, // Forzar respuesta JSON
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('GPT-4 API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'GPT-4 API failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gptData = await gptResponse.json();
    const analysisText = gptData.choices[0].message.content;
    console.log('✅ GPT-4 analysis received, length:', analysisText.length);

    // 10. Parsear respuesta JSON
    let insights;
    try {
      insights = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Error parsing GPT-4 response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse GPT-4 response', details: analysisText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Insights parsed:', {
      tasks: insights.tasks?.length || 0,
      decisions: insights.decisions?.length || 0,
      leads: insights.leads?.length || 0,
      obvs: insights.obv_mentions?.length || 0,
      blockers: insights.blockers?.length || 0,
      metrics: insights.metrics?.length || 0,
    });

    // 11. Guardar insights en la base de datos
    const insightsToInsert = [];

    // Tareas
    if (insights.tasks && insights.tasks.length > 0) {
      for (const task of insights.tasks) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'task',
          content: task,
          review_status: 'pending_review',
        });
      }
    }

    // Decisiones
    if (insights.decisions && insights.decisions.length > 0) {
      for (const decision of insights.decisions) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'decision',
          content: decision,
          review_status: 'pending_review',
        });
      }
    }

    // Leads
    if (insights.leads && insights.leads.length > 0) {
      for (const lead of insights.leads) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'lead',
          content: lead,
          review_status: 'pending_review',
        });
      }
    }

    // OBV mentions
    if (insights.obv_mentions && insights.obv_mentions.length > 0) {
      for (const obv of insights.obv_mentions) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'obv_update',
          content: obv,
          review_status: 'pending_review',
        });
      }
    }

    // Blockers
    if (insights.blockers && insights.blockers.length > 0) {
      for (const blocker of insights.blockers) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'blocker',
          content: blocker,
          review_status: 'pending_review',
        });
      }
    }

    // Metrics
    if (insights.metrics && insights.metrics.length > 0) {
      for (const metric of insights.metrics) {
        insightsToInsert.push({
          meeting_id: meetingId,
          insight_type: 'metric',
          content: metric,
          review_status: 'pending_review',
        });
      }
    }

    // Insertar todos los insights
    if (insightsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meeting_insights')
        .insert(insightsToInsert);

      if (insertError) {
        console.error('Error inserting insights:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save insights', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('✅ Insights saved to database:', insightsToInsert.length);

    // 12. Actualizar estado de la reunión
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        insights: insights,
        status: 'ready_for_review',
        ai_confidence_score: insights.confidence_score || 0.8,
        summary: insights.summary || '',
        key_points: insights.key_points || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update meeting', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Meeting updated to ready_for_review');

    // 13. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        insightsCount: insightsToInsert.length,
        insights: {
          tasks: insights.tasks?.length || 0,
          decisions: insights.decisions?.length || 0,
          leads: insights.leads?.length || 0,
          obvs: insights.obv_mentions?.length || 0,
          blockers: insights.blockers?.length || 0,
          metrics: insights.metrics?.length || 0,
        },
        status: 'ready_for_review',
        message: 'Analysis completed successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Construye el prompt para GPT-4
 */
function buildAnalysisPrompt(context: MeetingContext, participants: MeetingParticipant[]): string {
  const { meeting, projectMembers, projectOBVs, strategicContext } = context;

  const membersContext = projectMembers.map(m =>
    `- ${m.nombre} (${m.rol}) - ID: ${m.id}`
  ).join('\n');

  const obvsContext = projectOBVs.map(o =>
    `- ${o.titulo} (ID: ${o.id}) - Estado: ${o.estado}`
  ).join('\n');

  const participantsContext = participants.map(p => {
    const member = projectMembers.find(m => m.id === p.member_id);
    return member ? `- ${member.nombre}${p.attended ? ' (presente)' : ' (puede recibir tareas)'}` : '';
  }).filter(Boolean).join('\n');

  return `Analiza la siguiente transcripción de una reunión y extrae insights accionables.

# INFORMACIÓN DEL PROYECTO

## Miembros del equipo:
${membersContext || 'No disponibles'}

## OBVs (Objetivos) actuales:
${obvsContext || 'No disponibles'}

## Participantes de esta reunión:
${participantsContext || 'No disponibles'}

# CONTEXTO ESTRATÉGICO
${JSON.stringify(strategicContext, null, 2)}

# TRANSCRIPCIÓN
${meeting.transcript}

# INSTRUCCIONES

Analiza la transcripción y extrae los siguientes insights en formato JSON:

{
  "summary": "Resumen ejecutivo de la reunión en 2-3 frases",
  "key_points": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
  "confidence_score": 0.85,
  "tasks": [
    {
      "title": "Título de la tarea",
      "description": "Descripción detallada",
      "assigned_to": "ID del miembro asignado (del listado arriba)",
      "assigned_to_name": "Nombre del miembro",
      "priority": "alta|media|baja",
      "estimated_hours": 8,
      "deadline": "2024-03-15" (si se mencionó),
      "context": "Contexto de la discusión donde se mencionó"
    }
  ],
  "decisions": [
    {
      "title": "Título de la decisión",
      "description": "Descripción completa",
      "rationale": "Por qué se tomó esta decisión",
      "impact": "alto|medio|bajo",
      "stakeholders": ["IDs de miembros afectados"],
      "context": "Contexto de la discusión"
    }
  ],
  "leads": [
    {
      "company_name": "Nombre de la empresa",
      "contact_name": "Nombre del contacto",
      "contact_email": "email si se mencionó",
      "contact_phone": "teléfono si se mencionó",
      "opportunity": "Descripción de la oportunidad",
      "estimated_value": 50000,
      "stage": "prospecto|contactado|negociación|cerrado",
      "context": "Contexto de la discusión"
    }
  ],
  "obv_mentions": [
    {
      "obv_id": "ID del OBV mencionado",
      "obv_title": "Título del OBV",
      "update_type": "progreso|blocker|completado|ajuste",
      "description": "Qué se discutió sobre este OBV",
      "suggested_action": "Acción sugerida",
      "context": "Contexto de la discusión"
    }
  ],
  "blockers": [
    {
      "title": "Título del blocker",
      "description": "Descripción del problema",
      "affected_areas": ["Áreas afectadas"],
      "severity": "crítico|alto|medio|bajo",
      "suggested_solution": "Solución propuesta si se mencionó",
      "context": "Contexto de la discusión"
    }
  ],
  "metrics": [
    {
      "name": "Nombre de la métrica",
      "value": 1234,
      "unit": "unidad (€, usuarios, %, etc)",
      "trend": "subiendo|bajando|estable",
      "context": "Contexto de la discusión",
      "action_required": "Acción necesaria si aplica"
    }
  ]
}

REGLAS IMPORTANTES:
1. Solo extrae información que esté EXPLÍCITAMENTE mencionada en la transcripción
2. Para asignaciones de tareas, usa los IDs de los miembros del listado proporcionado
3. Si un OBV se menciona, usa su ID del listado
4. Sé conservador: mejor omitir un insight dudoso que inventar información
5. El confidence_score debe reflejar tu confianza en la precisión del análisis (0.0 a 1.0)
6. Todos los campos "context" deben incluir una cita o referencia a la parte relevante de la transcripción
7. Si no hay información para una categoría, devuelve un array vacío []
8. Todas las fechas en formato ISO (YYYY-MM-DD)
9. Responde ÚNICAMENTE con el JSON, sin texto adicional`;
}
