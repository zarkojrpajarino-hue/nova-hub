import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectContext {
  nombre: string;
  fase: string;
  tipo: string;
  onboarding_data: Record<string, unknown> | null;
  team: Array<{ nombre: string; role: string }>;
  obvs_count: number;
  leads_count: number;
  last_activity: string | null;
}

interface GeneratedTask {
  assignee: string;
  titulo: string;
  descripcion: string;
  prioridad: number;
  fecha_limite: string;
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

    const { project } = await req.json() as { project: ProjectContext };

    console.log('Generating tasks for project:', project.nombre);

    // Build the team list
    const teamList = project.team
      .map(m => `- ${m.nombre} (${m.role})`)
      .join('\n');

    // Build onboarding context
    const onboardingContext = project.onboarding_data 
      ? JSON.stringify(project.onboarding_data, null, 2)
      : 'No completado';

    // Calculate dates for this week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const systemPrompt = `Eres un coach de startups experto en metodología Lean Startup y gestión de proyectos de innovación. 
Tu objetivo es generar tareas específicas, accionables y medibles que ayuden al equipo a avanzar en su proyecto.

IMPORTANTE:
- Las tareas deben ser CONCRETAS y ESPECÍFICAS, no genéricas
- Cada tarea debe poder completarse en máximo 2-3 días
- Asigna tareas según el rol de cada miembro
- Las fechas límite deben estar entre ${formatDate(today)} y ${formatDate(nextWeek)}
- Prioridad 1 = Alta (urgente), 2 = Media, 3 = Baja

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional.`;

    const userPrompt = `CONTEXTO DEL PROYECTO:
- Nombre: ${project.nombre}
- Fase actual: ${project.fase}
- Tipo: ${project.tipo === 'operacion' ? 'En operación' : 'En validación'}
- Datos de onboarding: ${onboardingContext}

EQUIPO:
${teamList || 'Sin miembros asignados'}

SITUACIÓN ACTUAL:
- OBVs este mes: ${project.obvs_count}
- Leads en pipeline: ${project.leads_count}
- Última actividad: ${project.last_activity || 'Sin actividad reciente'}

Genera exactamente 3-5 tareas específicas para esta semana.
Formato JSON (array):
[
  {"assignee": "nombre_exacto_del_miembro", "titulo": "tarea concreta", "descripcion": "detalles de qué hacer y cómo", "prioridad": 1, "fecha_limite": "YYYY-MM-DD"}
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
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_tasks",
              description: "Generate weekly tasks for the project team",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        assignee: { type: "string", description: "Name of the team member to assign" },
                        titulo: { type: "string", description: "Task title in Spanish" },
                        descripcion: { type: "string", description: "Task description in Spanish" },
                        prioridad: { type: "number", enum: [1, 2, 3], description: "Priority: 1=High, 2=Medium, 3=Low" },
                        fecha_limite: { type: "string", description: "Due date in YYYY-MM-DD format" }
                      },
                      required: ["assignee", "titulo", "descripcion", "prioridad", "fecha_limite"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["tasks"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_tasks" } }
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

    // Extract tasks from tool call
    let tasks: GeneratedTask[] = [];
    
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        tasks = parsed.tasks || [];
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }

    // Fallback: try to parse from content if tool call failed
    if (tasks.length === 0 && aiResponse.choices?.[0]?.message?.content) {
      try {
        const content = aiResponse.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing content fallback:', e);
      }
    }

    console.log('Generated tasks:', tasks.length);

    return new Response(
      JSON.stringify({ tasks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating tasks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
