/**
 * 🎓 GENERATE LEARNING ROADMAP
 *
 * Edge Function que genera un roadmap de aprendizaje personalizado
 * para usuarios en modo individual
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authSupabase.auth.getClaims(token);

    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = claims.claims.sub;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      authUserId,
      'generate-learning-roadmap',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse request body
    const body: GenerateRoadmapRequest = await req.json();
    const { project_id, member_id, project_name, industry, business_idea } = body;

    // Validate required fields
    if (!project_id || !member_id || !project_name || !industry || !business_idea) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for data operations
    const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el usuario es miembro del proyecto
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('auth_id', authUserId)
      .single();

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userMembership } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', project_id)
      .eq('member_id', member_id)
      .single();

    if (!userMembership) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not a member of this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar roadmap con OpenAI
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

    // Llamar a OpenAI
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI Error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to generate roadmap with AI',
        details: errorData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    const content = openAIData.choices[0].message.content;

    // Parse respuesta
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (_e) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(JSON.stringify({
        error: 'Invalid response format from AI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roadmapSteps: RoadmapStep[] = parsedContent.roadmap || [];

    if (roadmapSteps.length === 0) {
      return new Response(JSON.stringify({
        error: 'No roadmap steps generated by AI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      roadmap: insertedSteps,
      count: insertedSteps.length,
      message: `✨ Roadmap de ${insertedSteps.length} etapas generado exitosamente`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
