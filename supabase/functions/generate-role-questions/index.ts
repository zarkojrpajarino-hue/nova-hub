import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { RoleQuestionsRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }
    const { serviceClient: supabaseClient } = await validateAuth(req);

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');// Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const authUserId = claims.claims.sub;

    // Rate limiting - AI generation is expensive
    const rateLimitResult = await checkRateLimit(
      authUserId,
      'generate-role-questions',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");

    // Parse and validate request body
    const body = await req.json();
    const validation = await validateRequestSafe(RoleQuestionsRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const { role } = validation.data;

    // Support both new schema (nombre/descripcion) and legacy (roleLabel/roleDescription)
    const roleLabel = String(role.roleLabel || role.nombre || '').slice(0, 100);
    const roleDescription = String(role.roleDescription || role.descripcion || '').slice(0, 500);

    console.log('Generating questions for role:', roleLabel);

    // Build members context (sanitized)
    interface RoleMember { nombre?: string; projectName?: string; }
    const members = role.members || [];
    const membersContext = members.length > 0
      ? members.slice(0, 10).map((m: RoleMember) => 
          `- ${String(m.nombre || '').slice(0, 100)} (Proyecto: ${String(m.projectName || '').slice(0, 100)})`
        ).join('\n')
      : 'Sin miembros asignados a este rol actualmente';

    const systemPrompt = `Eres un facilitador experto en reuniones de equipos de innovación y startups. 
Tu objetivo es generar preguntas poderosas que ayuden a los miembros con el mismo rol a compartir aprendizajes, 
desafíos y mejores prácticas entre proyectos.

Las preguntas deben:
- Fomentar el intercambio de experiencias específicas
- Ayudar a identificar patrones y aprendizajes comunes
- Ser abiertas pero enfocadas en el rol específico
- Generar discusión y reflexión profunda

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional.`;

    const userPrompt = `ROL: ${roleLabel}
DESCRIPCIÓN: ${roleDescription}

MIEMBROS CON ESTE ROL:
${membersContext}

Genera exactamente 5 preguntas poderosas para la próxima reunión de rol.
Las preguntas deben ser específicas para el rol "${roleLabel}" y ayudar a compartir aprendizajes entre proyectos.

Formato JSON (array):
[
  {"pregunta": "texto de la pregunta", "objetivo": "qué busca explorar esta pregunta"}
]`;

    console.log('Calling Claude API...');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Unable to generate questions at this time." }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Unable to generate questions at this time." }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const aiResponse = await response.json();
    console.log('Claude response received');

    // Extract questions from Claude response
    let questions: Array<{ pregunta: string; objetivo: string }> = [];

    const content = aiResponse.content?.[0]?.text || '';

    // Parse JSON from Claude response
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (_e) {
          if (error instanceof Response) return error;
console.error('Error parsing Claude response');
    }

    console.log('Generated questions:', questions.length);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error) {
        if (error instanceof Response) return error;
console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate questions at this time." }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
