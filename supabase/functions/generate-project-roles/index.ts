/**
 * 🤖 GENERATE PROJECT ROLES (v2)
 *
 * Edge Function que genera roles personalizados con Anthropic
 * basados en el proyecto, industria, idea de negocio y work mode
 *
 * NUEVA LÓGICA:
 * - NO usa roles predefinidos
 * - Genera roles 100% personalizados con IA
 * - Guarda en tabla project_roles
 * - Respeta límites del plan de suscripción
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { validateAuth } from '../_shared/auth.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface GenerateRolesRequest {
  project_id: string;
  project_name: string;
  industry: string;
  business_idea: string;
  work_mode: 'individual' | 'team_small' | 'team_established' | 'no_roles';
}

interface GeneratedRole {
  role_name: string;
  description: string;
  responsibilities: string[];
  required_skills: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'expert';
  department: string;
  is_critical: boolean;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { user, serviceClient: supabaseAdmin } = await validateAuth(req);

    // Rate limiting - AI generation is expensive
    const rateLimitResult = await checkRateLimit(
      user.id,
      'generate-project-roles',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Parse request body
    const body: GenerateRolesRequest = await req.json();
    const { project_id, project_name, industry, business_idea, work_mode } = body;

    // Validate required fields
    if (!project_id || !project_name || !industry || !business_idea || !work_mode) {
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

    // No generar roles si work_mode es 'no_roles'
    if (work_mode === 'no_roles') {
      await supabaseAdmin
        .from('projects')
        .update({
          ai_roles_generated: true,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', project_id);

      return new Response(JSON.stringify({
        success: true,
        roles: [],
        message: 'No roles generated for no_roles work mode'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Verificar que el proyecto puede usar AI generation
    const { data: subscription } = await supabaseAdmin
      .from('project_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('project_id', project_id)
      .single();

    if (!subscription?.plan?.ai_role_generation) {
      return new Response(JSON.stringify({
        error: 'AI role generation not available in current plan'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Verificar que el usuario es miembro del proyecto
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const { data: userMembership } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', project_id)
      .eq('member_id', userProfile.id)
      .single();

    if (!userMembership) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not a member of this project' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Determinar cantidad de roles según work mode
    const roleCount = work_mode === 'individual' ? 5 : work_mode === 'team_small' ? 8 : 12;

    // Prompt para Anthropic
    const systemPrompt = `Eres un experto en estructura organizacional y recursos humanos para startups y negocios digitales.
Tu tarea es generar roles personalizados y estratégicos para un proyecto empresarial.

Los roles deben ser:
- Realistas y adaptados a la industria específica
- Claramente definidos con responsabilidades concretas
- Escalables según el tamaño del equipo
- Estratégicos para el éxito del proyecto
- ÚNICOS y personalizados (NO uses nombres genéricos como "CEO", "CTO", etc.)

Genera EXACTAMENTE ${roleCount} roles en formato JSON.`;

    const userPrompt = `Genera ${roleCount} roles personalizados para este proyecto:

**Proyecto:** ${project_name}
**Industria:** ${industry}
**Idea de Negocio:** ${business_idea}
**Tamaño del equipo:** ${work_mode === 'individual' ? 'Individual (1-2 personas con roles múltiples)' : work_mode === 'team_small' ? 'Equipo pequeño (3-10 personas)' : 'Equipo establecido (10+ personas)'}

Para cada rol, proporciona:
- role_name: Nombre del rol ESPECÍFICO al proyecto (ej: "Especialista en Marketing de Productos SaaS B2B", NO solo "Marketing Manager")
- description: Descripción breve (2-3 frases) explicando por qué este rol es clave para ESTE proyecto específico
- responsibilities: Array de 4-6 responsabilidades concretas y accionables
- required_skills: Array de 4-6 habilidades técnicas y soft skills necesarias
- experience_level: "entry" | "mid" | "senior" | "expert"
- department: Departamento (ej: "Ventas", "Marketing", "Producto", "Tecnología", "Operaciones", "Customer Success")
- is_critical: true si es un rol crítico para el lanzamiento del MVP, false si es importante pero puede incorporarse después

IMPORTANTE: Los roles deben ser ÚNICOS al proyecto. No uses nombres genéricos. Personaliza según la industria y el negocio.

Responde ÚNICAMENTE con un objeto JSON con esta estructura:
{
  "roles": [
    {
      "role_name": "...",
      "description": "...",
      "responsibilities": ["...", "..."],
      "required_skills": ["...", "..."],
      "experience_level": "...",
      "department": "...",
      "is_critical": true/false
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
        error: 'Failed to generate roles with AI',
        details: errorData
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content[0].text;

    // Parse respuesta
    const parseResult = safeJsonParse<{ roles: GeneratedRole[] }>(content);
    if (!parseResult.ok) {
      console.error('Failed to parse Anthropic response:', content);
      return new Response(JSON.stringify({
        error: 'Invalid response format from AI'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Extraer array de roles
    const generatedRoles: GeneratedRole[] = parseResult.data.roles || [];

    if (generatedRoles.length === 0) {
      return new Response(JSON.stringify({
        error: 'No roles generated by AI'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Insertar roles en la base de datos
    const rolesToInsert = generatedRoles.map((role, index) => ({
      project_id: project_id,
      role_name: role.role_name,
      description: role.description,
      responsibilities: role.responsibilities,
      required_skills: role.required_skills,
      experience_level: role.experience_level,
      department: role.department,
      is_critical: role.is_critical ?? false,
      display_order: index + 1,
      created_by: userProfile.id,
    }));

    const { data: insertedRoles, error: insertError } = await supabaseAdmin
      .from('project_roles')
      .insert(rolesToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert roles:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to save roles to database',
        details: insertError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Actualizar project con roles generados
    await supabaseAdmin
      .from('projects')
      .update({
        ai_roles_generated: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id);

    return new Response(JSON.stringify({
      success: true,
      roles: insertedRoles,
      count: insertedRoles.length,
      message: `✨ ${insertedRoles.length} roles personalizados generados con IA`
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
