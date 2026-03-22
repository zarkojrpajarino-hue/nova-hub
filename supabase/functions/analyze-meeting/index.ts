/**
 * 🤖 ANALYZE MEETING — M18.10
 *
 * Analiza transcripciones de reuniones usando Claude (claude-sonnet-4-6).
 * Migrado de GPT-4o. Mismos 6 tipos de insight, mismo esquema JSON.
 *
 * M18.10: Claude reemplaza GPT-4o. transcription_confidence (M18.11) se pasa
 *   al prompt para que Claude sea más conservador con audio de baja calidad.
 *   Flag low_quality=true bypasea el check de status (el usuario confirmó manualmente).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

interface ProjectMember {
  id:     string;
  nombre: string;
  rol:    string;
  email?: string;
}

interface ProjectOBV {
  id:           string;
  titulo:       string;
  descripcion?: string;
  estado:       string;
}

interface MeetingParticipant {
  member_id:           string;
  attended?:           boolean;
  can_receive_tasks?:  boolean;
}

interface MeetingContext {
  meeting:             Record<string, unknown>;
  projectMembers:      ProjectMember[];
  projectOBVs:         ProjectOBV[];
  strategicContext:    Record<string, unknown>;
  transcriptionConf:   number;   // M18.11
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un experto en análisis de reuniones de negocios y equipos de producto.
Tu tarea es extraer insights accionables de transcripciones de reuniones.

Para cada insight, evalúa con qué grado de explicitez y certeza fue expresado:
- clarity_score (0.0–1.0): 1.0=hecho afirmativo ("cerramos el contrato"), 0.5=plan condicional ("deberíamos cerrar"), 0.2=posibilidad vaga ("quizás explorar").
- speaker_certainty: "definitive" (declaraciones cerradas: "cerramos","decidimos","hay que hacer X"), "conditional" (planes: "deberíamos","podríamos","cuando sea posible"), "speculative" (ideas: "quizás","a lo mejor","en algún momento").
Incluye SIEMPRE ambos campos en cada insight de tipo task, decision, blocker y metric.

CRÍTICO: Responde ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin texto fuera del JSON.`

// ── Edge function ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  const corsHeaders = getCorsHeaders(origin)
  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    // 1. Validar request
    const body = await req.json()
    const { meetingId, low_quality } = body as { meetingId: string; low_quality?: boolean }

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'meetingId is required' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    console.log('🤖 Starting Claude analysis for meeting:', meetingId);

    const { user, serviceClient: supabase } = await validateAuth(req);

    const rateLimitResult = await checkRateLimit(user.id, 'analyze-meeting', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) return createRateLimitResponse(rateLimitResult, corsHeaders);

    // 2. Obtener meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: jsonHeaders },
      );
    }

    await verifyProjectMembership(supabase, user.id, meeting.project_id as string, origin);

    if (!meeting.transcript) {
      return new Response(
        JSON.stringify({ error: 'Meeting has no transcript' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // low_quality=true → el usuario confirmó análisis manual de audio de baja calidad
    // En ese caso bypaseamos el check de status
    const transcriptionConf: number = typeof (meeting as Record<string, unknown>).transcription_confidence === 'number'
      ? ((meeting as Record<string, unknown>).transcription_confidence as number)
      : 0.6

    console.log('✅ Meeting loaded, transcript length:', (meeting.transcript as string).length,
      'confidence:', transcriptionConf.toFixed(3));

    // 3. Contexto del proyecto
    const { data: projectMembers } = await supabase
      .from('members')
      .select('id, nombre, rol, email')
      .eq('project_id', meeting.project_id);

    const { data: projectOBVs } = await supabase
      .from('obvs')
      .select('id, titulo, descripcion, estado')
      .eq('proyecto_id', meeting.project_id)
      .eq('activo', true);

    const { data: participants } = await supabase
      .from('meeting_participants')
      .select('member_id, attended, can_receive_tasks')
      .eq('meeting_id', meetingId);

    console.log('✅ Context loaded:', {
      members: projectMembers?.length ?? 0,
      obvs:    projectOBVs?.length    ?? 0,
      participants: participants?.length ?? 0,
    });

    // 4. Construir contexto + prompt
    const context: MeetingContext = {
      meeting:           meeting as Record<string, unknown>,
      projectMembers:    (projectMembers ?? []) as ProjectMember[],
      projectOBVs:       (projectOBVs    ?? []) as ProjectOBV[],
      strategicContext:  ((meeting as Record<string, unknown>).strategic_context as Record<string, unknown>) ?? {},
      transcriptionConf,
    };

    const userPrompt = buildAnalysisPrompt(context, participants ?? [], low_quality ?? false)

    // 5. Llamar a Claude
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    console.log('🤖 Calling Claude (claude-sonnet-4-6)...')

    const response = await anthropic.messages.create({
      model:       'claude-sonnet-4-6',
      max_tokens:  4096,
      temperature: 0.3,
      system:      SYSTEM_PROMPT,
      messages:    [{ role: 'user', content: userPrompt }],
    })

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('✅ Claude analysis received, length:', analysisText.length)

    // 6. Parsear JSON — DEUDA.3: fallback para cuando Claude envuelve el JSON en ```json
    let insights: Record<string, unknown[]>
    try {
      insights = JSON.parse(analysisText)
    } catch {
      // Claude a veces envuelve la respuesta en un bloque ```json … ``` — intentar extraerlo
      const fenced = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenced) {
        try {
          insights = JSON.parse(fenced[1])
        } catch (innerError) {
          console.error('Error parsing Claude fenced response:', innerError)
          return new Response(
            JSON.stringify({
              error:   'parse_error',
              message: 'Claude returned invalid JSON even inside a fenced block.',
              raw:     analysisText.slice(0, 200),
            }),
            { status: 422, headers: jsonHeaders },
          )
        }
      } else {
        console.error('Error parsing Claude response — no valid JSON found')
        return new Response(
          JSON.stringify({
            error:   'parse_error',
            message: 'Claude returned non-JSON output. Retry or check the prompt.',
            raw:     analysisText.slice(0, 200),
          }),
          { status: 422, headers: jsonHeaders },
        )
      }
    }

    console.log('✅ Insights parsed:', {
      tasks:     insights.tasks?.length      ?? 0,
      decisions: insights.decisions?.length  ?? 0,
      leads:     insights.leads?.length      ?? 0,
      obvs:      insights.obv_mentions?.length ?? 0,
      blockers:  insights.blockers?.length   ?? 0,
      metrics:   insights.metrics?.length    ?? 0,
    });

    // 7. Guardar insights en meeting_insights
    const insightsToInsert: Record<string, unknown>[] = []

    const types: Array<[string, string]> = [
      ['tasks',       'task'],
      ['decisions',   'decision'],
      ['leads',       'lead'],
      ['obv_mentions','obv_update'],
      ['blockers',    'blocker'],
      ['metrics',     'metric'],
    ]

    for (const [key, insightType] of types) {
      for (const item of (insights[key] ?? [])) {
        insightsToInsert.push({
          meeting_id:    meetingId,
          insight_type:  insightType,
          content:       item,
          review_status: 'pending_review',
        })
      }
    }

    if (insightsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meeting_insights')
        .insert(insightsToInsert);

      if (insertError) {
        console.error('Error inserting insights:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save insights', details: insertError }),
          { status: 500, headers: jsonHeaders },
        );
      }
    }

    console.log('✅ Insights saved:', insightsToInsert.length);

    // 8. Actualizar meeting
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        insights:            insights,
        status:              'ready_for_review',
        ai_confidence_score: (insights.confidence_score as number) ?? 0.8,
        summary:             (insights.summary as string)          ?? '',
        key_points:          (insights.key_points as string[])     ?? [],
        updated_at:          new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update meeting', details: updateError }),
        { status: 500, headers: jsonHeaders },
      );
    }

    console.log('✅ Meeting updated to ready_for_review');

    return new Response(
      JSON.stringify({
        success:        true,
        meetingId,
        insightsCount:  insightsToInsert.length,
        insights: {
          tasks:     insights.tasks?.length      ?? 0,
          decisions: insights.decisions?.length  ?? 0,
          leads:     insights.leads?.length      ?? 0,
          obvs:      insights.obv_mentions?.length ?? 0,
          blockers:  insights.blockers?.length   ?? 0,
          metrics:   insights.metrics?.length    ?? 0,
        },
        status:  'ready_for_review',
        message: 'Analysis completed successfully',
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message }),
      { status: 500, headers: jsonHeaders },
    );
  }
});

// ── buildAnalysisPrompt ───────────────────────────────────────────────────────

function buildAnalysisPrompt(
  context: MeetingContext,
  participants: MeetingParticipant[],
  lowQuality: boolean,
): string {
  const { meeting, projectMembers, projectOBVs, strategicContext, transcriptionConf } = context;

  const membersContext     = projectMembers.map(m => `- ${m.nombre} (${m.rol}) — ID: ${m.id}`).join('\n')
  const obvsContext        = projectOBVs.map(o => `- ${o.titulo} (ID: ${o.id}) — Estado: ${o.estado}`).join('\n')
  const participantsContext = participants.map(p => {
    const m = projectMembers.find(x => x.id === p.member_id)
    return m ? `- ${m.nombre}${p.attended ? ' (presente)' : ' (puede recibir tareas)'}` : ''
  }).filter(Boolean).join('\n')

  const qualityNote = lowQuality
    ? `⚠ NOTA: La calidad de la transcripción es baja (${Math.round(transcriptionConf * 100)}%). Sé más conservador al extraer insights — solo incluye lo que esté claramente expresado. Marca clarity_score ≤ 0.5 para cualquier elemento incierto.`
    : transcriptionConf < 0.7
      ? `Nota: Transcripción con confianza media (${Math.round(transcriptionConf * 100)}%). Sé conservador con inferencias.`
      : `Transcripción de alta calidad (${Math.round(transcriptionConf * 100)}%).`

  return `Analiza la siguiente transcripción y extrae insights accionables.

${qualityNote}

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

Extrae los siguientes insights en formato JSON:

{
  "summary": "Resumen ejecutivo en 2-3 frases",
  "key_points": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
  "confidence_score": 0.85,
  "tasks": [
    {
      "title": "Título de la tarea",
      "description": "Descripción detallada",
      "assigned_to": "ID del miembro (del listado arriba)",
      "assigned_to_name": "Nombre del miembro",
      "priority": "alta|media|baja",
      "estimated_hours": 8,
      "deadline": "YYYY-MM-DD (si se mencionó)",
      "context": "Cita o referencia de la transcripción",
      "transcript_fragment": "Frase exacta de la transcripción que origina este insight (máx 120 caracteres)",
      "transcript_timestamp": "Marca de tiempo en el audio en formato MM:SS (si está disponible, si no omitir)",
      "clarity_score": 0.85,
      "speaker_certainty": "definitive|conditional|speculative"
    }
  ],
  "decisions": [
    {
      "title": "Título de la decisión",
      "description": "Descripción completa",
      "rationale": "Por qué se tomó",
      "impact": "alto|medio|bajo",
      "stakeholders": ["IDs de miembros afectados"],
      "context": "Cita o referencia",
      "transcript_fragment": "Frase exacta de la transcripción que origina este insight (máx 120 caracteres)",
      "transcript_timestamp": "Marca de tiempo en el audio en formato MM:SS (si está disponible, si no omitir)",
      "clarity_score": 0.85,
      "speaker_certainty": "definitive|conditional|speculative"
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
      "context": "Cita o referencia"
    }
  ],
  "obv_mentions": [
    {
      "obv_id": "ID del OBV mencionado",
      "obv_title": "Título del OBV",
      "update_type": "progreso|blocker|completado|ajuste",
      "description": "Qué se discutió",
      "suggested_action": "Acción sugerida",
      "context": "Cita o referencia"
    }
  ],
  "blockers": [
    {
      "title": "Título del blocker",
      "description": "Descripción del problema",
      "affected_areas": ["Áreas afectadas"],
      "severity": "crítico|alto|medio|bajo",
      "suggested_solution": "Solución propuesta si se mencionó",
      "context": "Cita o referencia",
      "transcript_fragment": "Frase exacta de la transcripción que origina este insight (máx 120 caracteres)",
      "transcript_timestamp": "Marca de tiempo en el audio en formato MM:SS (si está disponible, si no omitir)",
      "clarity_score": 0.85,
      "speaker_certainty": "definitive|conditional|speculative"
    }
  ],
  "metrics": [
    {
      "name": "Nombre de la métrica",
      "value": 1234,
      "unit": "€, usuarios, %, etc",
      "trend": "subiendo|bajando|estable",
      "context": "Cita o referencia",
      "transcript_fragment": "Frase exacta de la transcripción que origina este insight (máx 120 caracteres)",
      "transcript_timestamp": "Marca de tiempo en el audio en formato MM:SS (si está disponible, si no omitir)",
      "action_required": "Acción necesaria si aplica",
      "clarity_score": 0.85,
      "speaker_certainty": "definitive|conditional|speculative"
    }
  ]
}

REGLAS:
1. Solo extrae información EXPLÍCITAMENTE mencionada en la transcripción
2. Para asignaciones, usa los IDs del listado proporcionado
3. Si un OBV se menciona, usa su ID del listado
4. Sé conservador: mejor omitir un insight dudoso que inventar información
5. confidence_score refleja tu confianza en la precisión del análisis (0.0–1.0)
6. Si no hay información para una categoría, devuelve []
7. Todas las fechas en formato ISO (YYYY-MM-DD)`
}
