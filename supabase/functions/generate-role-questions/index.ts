import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { RoleQuestionsRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { validateAuth } from '../_shared/auth.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { logAICall } from '../_shared/aiLogger.ts';

// [B6] In-memory cache by role label (survives between Deno Deploy invocations)
const roleCache = new Map<string, { questions: unknown[]; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { user } = await validateAuth(req);

    // Rate limiting - AI generation is expensive
    const rateLimitResult = await checkRateLimit(
      user.id,
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

    // [B6] Check cache first
    const cacheKey = roleLabel.toLowerCase().trim();
    const cached = roleCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log('Cache hit for role:', roleLabel);
      return new Response(
        JSON.stringify({ questions: cached.questions, cached: true }),
        { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

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

    const startTime = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",  // [SCALE] Downgrade: role questions are lookup+template, Haiku suffices
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
    const durationMs = Date.now() - startTime;
    console.log('Claude response received');

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supaLog = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    await logAICall({
      supabaseClient: supaLog, projectId: undefined, userId: user.id,
      functionName: 'generate-role-questions', inputData: { role: roleLabel },
      outputData: aiResponse.content?.[0]?.text?.slice(0, 500), success: true, executionTimeMs: durationMs,
      tokensUsed: (aiResponse.usage?.input_tokens ?? 0) + (aiResponse.usage?.output_tokens ?? 0),
      modelUsed: 'claude-haiku-4-5-20251001',
    });

    // Extract questions from Claude response
    let questions: Array<{ pregunta: string; objetivo: string }> = [];

    const content = aiResponse.content?.[0]?.text || '';

    // Parse JSON from Claude response
    const parseResult = safeJsonParse<Array<{ pregunta: string; objetivo: string }>>(content, 'array');
    if (parseResult.ok) {
      questions = parseResult.data;
    } else {
      console.error('Error parsing Claude response:', parseResult.error);
    }

    console.log('Generated questions:', questions.length);

    // [B6] Cache the result
    if (questions.length > 0) {
      roleCache.set(cacheKey, { questions, cachedAt: Date.now() });
    }

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
