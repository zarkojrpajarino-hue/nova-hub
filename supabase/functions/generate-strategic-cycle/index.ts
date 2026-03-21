/**
 * CE25.4+CE25.5 — generate-strategic-cycle
 *
 * Genera un ciclo estratégico de 90 días con 3-4 objetivos ponderados.
 * Ciclo 0 (Estabilización) = semi-guiado con ejes fijos.
 * Ciclo 1+ = 100% generado por IA basándose en contexto actual.
 *
 * Input: { projectId, trigger: 'graduation' | 'cycle_completed' | 'cycle_revised' | 'manual' }
 * Output: strategic_cycles row insertada con status='active'
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

    // Auth client for user verification
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse input
    const body = await req.json();
    const { projectId, trigger } = body as {
      projectId: string;
      trigger: 'graduation' | 'cycle_completed' | 'cycle_revised' | 'manual';
    };

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Verify user is a member of the project
    const authUserId = claims.claims.sub;
    const { data: memberCheck } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('member_id', (await supabase.from('profiles').select('id').eq('auth_id', authUserId).single()).data?.id ?? '')
      .maybeSingle();

    if (!memberCheck) {
      return new Response(
        JSON.stringify({ error: 'Not a member of this project' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Check no active cycle exists
    const { data: activeCycle } = await supabase
      .from('strategic_cycles')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeCycle) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un ciclo activo para este proyecto' }),
        { status: 409, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Get next cycle_index
    const { data: lastCycle } = await supabase
      .from('strategic_cycles')
      .select('cycle_index')
      .eq('project_id', projectId)
      .order('cycle_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextIndex = (lastCycle?.cycle_index ?? -1) + 1;
    const isStabilization = nextIndex === 0;

    // Gather context
    const [projectResult, metricsResult, prevCyclesResult, phaseResult] = await Promise.all([
      supabase.from('projects').select('nombre, descripcion, onboarding_data').eq('id', projectId).single(),
      supabase.from('key_metrics').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(3),
      supabase.from('strategic_cycles').select('title, objectives, cycle_score, status').eq('project_id', projectId).eq('status', 'completed').order('cycle_index', { ascending: false }).limit(3),
      supabase.from('project_phase_state').select('current_phase, phase_score, graduated').eq('project_id', projectId).maybeSingle(),
    ]);

    const project = projectResult.data;
    const metrics = metricsResult.data ?? [];
    const prevCycles = prevCyclesResult.data ?? [];
    const phaseState = phaseResult.data;

    const contextSummary = {
      project_name: project?.nombre,
      project_description: project?.descripcion,
      current_phase: phaseState?.current_phase,
      phase_score: phaseState?.phase_score,
      graduated: phaseState?.graduated,
      recent_mrr: metrics[0]?.mrr ?? 0,
      recent_customers: metrics[0]?.total_customers ?? 0,
      previous_cycles: prevCycles.map(c => ({
        title: c.title,
        score: c.cycle_score,
        objectives_summary: c.objectives,
      })),
      trigger,
    };

    // Build prompt
    let objectivesPrompt: string;

    if (isStabilization) {
      // CE25.5 — Ciclo de Estabilización: ejes fijos, IA personaliza targets y pesos
      objectivesPrompt = `
Este es el PRIMER ciclo estratégico del proyecto (Ciclo de Estabilización).
Los 4 ejes son FIJOS (no inventes otros):
1. **Crecimiento**: Mantener o mejorar growth rate actual (métrica: MRR growth %)
2. **Equipo**: Cubrir roles críticos o mejorar performance (métrica: roles cubiertos o performance score)
3. **Eficiencia**: Reducir concentración de revenue o mejorar márgenes (métrica: margen % o top_client_pct)
4. **Automatización**: Documentar procesos o automatizar tareas repetitivas (métrica: SOPs creados o tasks automatizadas)

Tu trabajo: asignar pesos (suman 1.0) y targets REALISTAS basándote en el contexto.
MRR actual: €${contextSummary.recent_mrr}. Clientes: ${contextSummary.recent_customers}.
Título del ciclo: "Ciclo de Estabilización".`;
    } else {
      objectivesPrompt = `
Genera 3-4 objetivos estratégicos NUEVOS y RELEVANTES para este proyecto.
Cada objetivo debe ser medible, específico y alcanzable en 90 días.
Considera qué logró y qué NO logró en ciclos anteriores.
${prevCycles.length > 0 ? `Ciclos anteriores: ${JSON.stringify(prevCycles.map(c => ({ title: c.title, score: c.score })))}` : 'No hay ciclos anteriores.'}
MRR actual: €${contextSummary.recent_mrr}. Clientes: ${contextSummary.recent_customers}.
Genera un título de ciclo (5-7 palabras) que resuma la estrategia.`;
    }

    // Call Claude
    const systemPrompt = `Eres un estratega de startups de élite. Genera objetivos estratégicos para ciclos de 90 días.

FORMATO DE RESPUESTA (JSON válido):
{
  "title": "Título del ciclo (5-7 palabras)",
  "description": "Descripción breve del ciclo (1-2 oraciones)",
  "objectives": [
    {
      "id": "obj_1",
      "title": "Título del objetivo",
      "description": "Qué se busca lograr",
      "weight": 0.30,
      "metric_name": "Nombre de la métrica",
      "target_value": 100,
      "current_value": 0
    }
  ]
}

REGLAS:
- Los pesos (weight) DEBEN sumar 1.0 exacto.
- target_value debe ser numérico y realista para 90 días.
- current_value empieza en 0 (se llenará con datos reales).
- Mínimo 3, máximo 4 objetivos.
- Responde SOLO con JSON válido, sin texto adicional.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Contexto del proyecto:\n${JSON.stringify(contextSummary, null, 2)}\n\n${objectivesPrompt}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return new Response(
        JSON.stringify({ error: 'Error generando ciclo estratégico' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text ?? '';

    // Parse JSON from AI response
    let cycleData: { title: string; description: string; objectives: unknown[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      cycleData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Error parseando respuesta de IA' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Validate objectives: weights must sum to ~1.0, min 2 objectives
    const objectives = cycleData.objectives as Array<{ weight: number; target_value: number }>;
    if (!objectives || objectives.length < 2) {
      return new Response(
        JSON.stringify({ error: 'IA generó menos de 2 objetivos' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }
    const totalWeight = objectives.reduce((sum, o) => sum + (o.weight ?? 0), 0);
    if (totalWeight < 0.95 || totalWeight > 1.05) {
      // Normalize weights to sum to 1.0
      for (const obj of objectives) {
        obj.weight = obj.weight / totalWeight;
      }
    }

    // Calculate dates
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 90 * 86_400_000).toISOString().split('T')[0];

    // Insert cycle
    const { data: newCycle, error: insertErr } = await supabase
      .from('strategic_cycles')
      .insert({
        project_id: projectId,
        cycle_index: nextIndex,
        start_date: startDate,
        end_date: endDate,
        title: cycleData.title || (isStabilization ? 'Ciclo de Estabilización' : 'Ciclo Estratégico'),
        description: cycleData.description || '',
        objectives: cycleData.objectives,
        cycle_score: 0,
        status: 'active',
        engine_snapshot: {},
        generation_context: contextSummary,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(
        JSON.stringify({ error: 'Error guardando ciclo' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, cycle: newCycle }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-strategic-cycle:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
