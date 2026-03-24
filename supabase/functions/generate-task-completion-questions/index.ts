import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { TaskCompletionQuestionsRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { validateAuth } from '../_shared/auth.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { logAICall } from '../_shared/aiLogger.ts';

interface Question {
  pregunta: string;
  tipo: 'texto' | 'escala' | 'opciones';
  opciones?: string[];
  placeholder?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { user } = await validateAuth(req);

    // Rate limiting - AI generation is expensive
    const rateLimitResult = await checkRateLimit(
      user.id,
      'generate-task-completion-questions',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");

    // Parse and validate request body
    const body = await req.json();
    const validation = await validateRequestSafe(TaskCompletionQuestionsRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const { task } = validation.data;

    const taskTitle = String(task.titulo || '').slice(0, 200);
    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('Generating completion questions for task:', taskTitle);

    const systemPrompt = `Eres un coach de startups experto. Tu tarea es generar 2-3 preguntas de reflexión personalizadas para cuando un miembro del equipo completa una tarea.

Las preguntas deben:
1. Ser específicas para la tarea completada
2. Extraer aprendizajes valiosos
3. Ayudar a identificar mejoras para el futuro
4. Ser concisas y fáciles de responder

Responde ÚNICAMENTE con un JSON válido con el formato:
{
  "questions": [
    {
      "pregunta": "texto de la pregunta",
      "tipo": "texto",
      "placeholder": "sugerencia de respuesta"
    }
  ]
}`;

    const taskDescription = String(task.descripcion || 'Sin descripción').slice(0, 500);
    const metadata = (task.metadata || {}) as Record<string, unknown>;
    
    const userPrompt = `Tarea completada:
Título: ${taskTitle}
Descripción: ${taskDescription}

${Object.keys(metadata).length > 0 ? `Contexto adicional:
- Tipo de tarea: ${String(metadata.tipo_tarea || 'general').slice(0, 100)}
- Resultado esperado: ${String(metadata.resultado_esperado || 'No especificado').slice(0, 300)}
` : ''}

Genera 2-3 preguntas de reflexión específicas para esta tarea.`;

    const startTime = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",  // [SCALE] Downgrade: task completion questions are simple, Haiku suffices
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      // Return fallback questions
      return new Response(
        JSON.stringify({ 
          questions: [
            {
              pregunta: "¿Qué fue lo más desafiante de esta tarea?",
              tipo: "texto",
              placeholder: "Describe el principal obstáculo que encontraste..."
            },
            {
              pregunta: "¿Qué recursos o apoyo te hubieran ayudado?",
              tipo: "texto",
              placeholder: "Herramientas, información, contactos..."
            }
          ]
        }),
        { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const aiResponse = await response.json();
    const durationMs = Date.now() - startTime;
    const content = aiResponse.content?.[0]?.text || '';

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supaLog = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    await logAICall({
      supabaseClient: supaLog, projectId: undefined, userId: user.id,
      functionName: 'generate-task-completion-questions', inputData: { taskTitle },
      outputData: content?.slice(0, 500), success: true, executionTimeMs: durationMs,
      tokensUsed: (aiResponse.usage?.input_tokens ?? 0) + (aiResponse.usage?.output_tokens ?? 0),
      modelUsed: 'claude-haiku-4-5-20251001',
    });

    // Parse the response
    let questions: Question[] = [];
    const parseResult = safeJsonParse<{ questions: Question[] }>(content);
    if (parseResult.ok) {
      questions = parseResult.data.questions || [];
    } else {
      console.error('Error parsing AI response:', parseResult.error);
      // Use fallback questions
      questions = [
        {
          pregunta: "¿Qué fue lo más desafiante de esta tarea?",
          tipo: "texto",
          placeholder: "Describe el principal obstáculo que encontraste..."
        }
      ];
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
      JSON.stringify({ 
        error: "Unable to generate questions at this time",
        questions: []
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
