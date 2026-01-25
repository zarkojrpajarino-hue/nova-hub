import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { RoleQuestionsRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter.ts';

interface RoleContext {
  role: string;
  roleLabel: string;
  roleDescription: string;
  members: Array<{ nombre: string; projectName: string }>;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = claims.claims.sub;

    // Rate limiting - AI generation is expensive
    const rateLimitResult = checkRateLimit(
      authUserId,
      'generate-role-questions',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const LOVABLE_API_KEY = requireEnv("LOVABLE_API_KEY");

    // Parse and validate request body
    const body = await req.json();
    const validation = await validateRequestSafe(RoleQuestionsRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { role } = validation.data;

    const roleLabel = String(role.roleLabel || '').slice(0, 100);
    const roleDescription = String(role.roleDescription || '').slice(0, 500);

    console.log('Generating questions for role:', roleLabel);

    // Build members context (sanitized)
    const membersContext = (role.members || []).length > 0
      ? (role.members || []).slice(0, 10).map(m => 
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

    console.log('Calling AI gateway...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate discussion questions for a role meeting",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pregunta: { type: "string", description: "The discussion question in Spanish" },
                        objetivo: { type: "string", description: "What this question aims to explore" }
                      },
                      required: ["pregunta", "objetivo"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Unable to generate questions at this time." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Unable to generate questions at this time." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI response received');

    // Extract questions from tool call
    let questions: Array<{ pregunta: string; objetivo: string }> = [];
    
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        questions = parsed.questions || [];
      } catch (e) {
        console.error('Error parsing tool call arguments');
      }
    }

    // Fallback: try to parse from content if tool call failed
    if (questions.length === 0 && aiResponse.choices?.[0]?.message?.content) {
      try {
        const content = aiResponse.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing content fallback');
      }
    }

    console.log('Generated questions:', questions.length);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate questions at this time." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
