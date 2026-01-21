import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoleContext {
  role: string;
  roleLabel: string;
  roleDescription: string;
  members: Array<{ nombre: string; projectName: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { role } = await req.json() as { role: RoleContext };

    console.log('Generating questions for role:', role.roleLabel);

    // Build members context
    const membersContext = role.members.length > 0
      ? role.members.map(m => `- ${m.nombre} (Proyecto: ${m.projectName})`).join('\n')
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

    const userPrompt = `ROL: ${role.roleLabel}
DESCRIPCIÓN: ${role.roleDescription}

MIEMBROS CON ESTE ROL:
${membersContext}

Genera exactamente 5 preguntas poderosas para la próxima reunión de rol.
Las preguntas deben ser específicas para el rol "${role.roleLabel}" y ayudar a compartir aprendizajes entre proyectos.

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
          JSON.stringify({ error: "Límite de solicitudes excedido. Inténtalo de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
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
        console.error('Error parsing tool call arguments:', e);
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
        console.error('Error parsing content fallback:', e);
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
