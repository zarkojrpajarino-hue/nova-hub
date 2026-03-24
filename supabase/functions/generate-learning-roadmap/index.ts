/**
 * 🎓 GENERATE LEARNING ROADMAP
 *
 * Edge Function que genera un roadmap de aprendizaje personalizado
 * para usuarios en modo individual
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { logAICall } from '../_shared/aiLogger.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface GenerateRoadmapRequest {
  project_id: string;
  member_id: string;
  project_name: string;
  industry: string;
  business_idea: string;
}

interface RoadmapStep {
  role_name: string;
  description: string;
  step_order: number;
  tasks_required: number;
  obvs_required: number;
  estimated_weeks: number;
  skills_to_learn: string[];
  unlock_criteria: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { user, serviceClient: supabaseAdmin } = await validateAuth(req);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      user.id,
      'generate-learning-roadmap',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Parse request body
    const body: GenerateRoadmapRequest = await req.json();
    const { project_id, member_id, project_name, industry, business_idea } = body;

    // Validate required fields
    if (!project_id || !member_id || !project_name || !industry || !business_idea) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Sanitize user free-text inputs
    const sanitizedBizIdea = sanitizePromptInput(business_idea, SanitizerPresets.LONG_INPUT);
    if (sanitizedBizIdea.blocked) {
      return new Response(JSON.stringify({ error: sanitizedBizIdea.reason }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Verificar que el proyecto está en modo individual
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('work_mode')
      .eq('id', project_id)
      .single();

    if (project?.work_mode !== 'individual') {
      return new Response(JSON.stringify({
        error: 'Learning roadmap is only available for individual work mode'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // B2.B — Use shared verifyProjectMembership
    await verifyProjectMembership(supabaseAdmin, user.id, project_id, origin);

    const { data: userMembership } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', project_id)
      .eq('member_id', member_id)
      .single();

    if (!userMembership) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not a member of this project' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Generar roadmap con Anthropic
    const systemPrompt = `Eres un experto en desarrollo profesional y aprendizaje de habilidades empresariales.
Tu tarea es crear un roadmap de aprendizaje secuencial para una persona que trabajará SOLA en su proyecto.

El roadmap debe:
- Tener EXACTAMENTE 5 roles/etapas secuenciales
- Ser progresivo: cada rol construye sobre los anteriores
- Ser práctico y accionable
- Estar adaptado a la industria específica
- Incluir habilidades técnicas Y soft skills`;

    const userPrompt = `Genera un roadmap de aprendizaje de 5 etapas para esta persona:

**Proyecto:** ${project_name}
**Industria:** ${industry}
**Idea de Negocio:** ${business_idea}
**Contexto:** La persona trabajará SOLA y aprenderá todos los roles secuencialmente.

Para cada etapa del roadmap, proporciona:
- role_name: Nombre del rol (ej: "Fundador Técnico", "Growth Hacker")
- description: Por qué este rol es importante en ESTA etapa (2-3 frases)
- step_order: Orden secuencial (1, 2, 3, 4, 5)
- tasks_required: Número de tareas a completar (entre 5-15)
- obvs_required: Número de OBVs a validar (entre 2-8)
- estimated_weeks: Semanas estimadas para dominar este rol (entre 1-4)
- skills_to_learn: Array de 4-6 habilidades específicas a desarrollar
- unlock_criteria: Texto explicando qué debe lograr para desbloquear el siguiente rol

IMPORTANTE:
- Los primeros roles deben ser más fáciles y rápidos (1-2 semanas)
- Los últimos roles más complejos (3-4 semanas)
- El orden debe tener sentido (ej: primero Product, luego Marketing, luego Sales)

Responde ÚNICAMENTE con un objeto JSON:
{
  "roadmap": [
    {
      "role_name": "...",
      "description": "...",
      "step_order": 1,
      "tasks_required": 8,
      "obvs_required": 3,
      "estimated_weeks": 2,
      "skills_to_learn": ["...", "..."],
      "unlock_criteria": "..."
    }
  ]
}`;

    // Llamar a Anthropic
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Anthropic API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error('Anthropic Error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to generate roadmap with AI',
        details: errorData
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content[0].text;

    // Parse respuesta
    const parseResult = safeJsonParse<{ roadmap: RoadmapStep[] }>(content);
    if (!parseResult.ok) {
      console.error('Failed to parse Anthropic response:', content);
      return new Response(JSON.stringify({
        error: 'Invalid response format from AI'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }
    const parsedContent = parseResult.data;

    const roadmapSteps: RoadmapStep[] = parsedContent.roadmap || [];

    if (roadmapSteps.length === 0) {
      return new Response(JSON.stringify({
        error: 'No roadmap steps generated by AI'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Insertar steps en la base de datos
    const stepsToInsert = roadmapSteps.map((step) => ({
      project_id: project_id,
      member_id: member_id,
      role_name: step.role_name,
      description: step.description,
      step_order: step.step_order,
      tasks_required: step.tasks_required,
      obvs_required: step.obvs_required,
      estimated_weeks: step.estimated_weeks,
      skills_to_learn: step.skills_to_learn,
      unlock_criteria: step.unlock_criteria,
      tasks_completed: 0,
      obvs_completed: 0,
    }));

    const { data: insertedSteps, error: insertError } = await supabaseAdmin
      .from('learning_roadmap_steps')
      .insert(stepsToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert roadmap steps:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to save roadmap to database',
        details: insertError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      roadmap: insertedSteps,
      count: insertedSteps.length,
      message: `✨ Roadmap de ${insertedSteps.length} etapas generado exitosamente`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });

  } catch (error: unknown) {
        if (error instanceof Response) return error;
console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });
  }
});
