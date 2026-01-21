import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskContext {
  titulo: string;
  descripcion: string | null;
  playbook?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface Question {
  pregunta: string;
  tipo: 'texto' | 'escala' | 'opciones';
  opciones?: string[];
  placeholder?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { task } = await req.json() as { task: TaskContext };

    console.log('Generating completion questions for task:', task.titulo);

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

    const userPrompt = `Tarea completada:
Título: ${task.titulo}
Descripción: ${task.descripcion || 'Sin descripción'}

${task.metadata ? `Contexto adicional:
- Tipo de tarea: ${(task.metadata as Record<string, unknown>).tipo_tarea || 'general'}
- Resultado esperado: ${(task.metadata as Record<string, unknown>).resultado_esperado || 'No especificado'}
` : ''}

Genera 2-3 preguntas de reflexión específicas para esta tarea.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the response
    let questions: Question[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [];
      }
    } catch (parseErr) {
      console.error('Error parsing AI response:', parseErr);
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido",
        questions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
