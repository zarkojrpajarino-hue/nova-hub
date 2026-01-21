import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROLE_INFO: Record<string, { label: string; description: string; kpis: string[] }> = {
  sales: { 
    label: 'Customer (Ventas)', 
    description: 'Responsable de prospección, ventas y relación con clientes',
    kpis: ['Leads contactados', 'Demos agendadas', 'Conversión', 'Ticket medio']
  },
  customer: { 
    label: 'Customer (Ventas)', 
    description: 'Responsable de prospección, ventas y relación con clientes',
    kpis: ['Leads contactados', 'Demos agendadas', 'Conversión', 'Ticket medio']
  },
  marketing: { 
    label: 'Marketing', 
    description: 'Responsable de visibilidad, contenido y generación de leads',
    kpis: ['Alcance', 'Engagement', 'Leads generados', 'CAC']
  },
  operations: { 
    label: 'Operations', 
    description: 'Responsable de procesos, eficiencia y coordinación',
    kpis: ['Procesos documentados', 'Tiempo de entrega', 'Eficiencia operativa']
  },
  leader: { 
    label: 'Team Leader', 
    description: 'Responsable de estrategia, equipo y decisiones clave',
    kpis: ['OKRs cumplidos', 'Satisfacción equipo', 'Velocidad ejecución']
  },
  strategy: { 
    label: 'Strategy', 
    description: 'Responsable de visión, roadmap y análisis estratégico',
    kpis: ['Hitos alcanzados', 'Pivotes exitosos', 'Métricas north star']
  },
  finance: { 
    label: 'Finance', 
    description: 'Responsable de control financiero, pricing y rentabilidad',
    kpis: ['Margen', 'Cash flow', 'Runway', 'Unit economics']
  },
  ai_tech: { 
    label: 'AI/Tech', 
    description: 'Responsable de tecnología, automatizaciones e innovación',
    kpis: ['Automatizaciones', 'Tiempo ahorrado', 'Integraciones activas']
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, meetingType = 'semanal', duracionMinutos = 30 } = await req.json();
    
    if (!role) {
      throw new Error('role is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating questions for role:', role);

    // Get all members with this role
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select(`
        member_id,
        role,
        project_id,
        projects!inner(nombre, fase),
        profiles!inner(id, nombre)
      `)
      .eq('role', role);

    if (membersError) {
      throw membersError;
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ questions: [], message: 'No members with this role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get context for each member
    const membersWithContext = await Promise.all(
      members.map(async (m) => {
        const memberId = m.member_id;
        
        // Recent tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('titulo, status, completed_at')
          .eq('assignee_id', memberId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Recent insights
        const { data: insights } = await supabase
          .from('user_insights')
          .select('tipo, titulo, contenido')
          .eq('user_id', memberId)
          .order('created_at', { ascending: false })
          .limit(3);

        // Task stats this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: completedThisWeek } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', memberId)
          .eq('status', 'done')
          .gte('completed_at', weekAgo.toISOString());

        const { count: pendingTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', memberId)
          .neq('status', 'done');

        // OBVs this month
        const monthStart = new Date();
        monthStart.setDate(1);
        
        const { count: obvsThisMonth } = await supabase
          .from('obvs')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', memberId)
          .gte('created_at', monthStart.toISOString());

        return {
          id: memberId,
          nombre: (m.profiles as any).nombre,
          project_nombre: (m.projects as any).nombre,
          project_fase: (m.projects as any).fase,
          tareas_completadas_semana: completedThisWeek || 0,
          tareas_pendientes: pendingTasks || 0,
          obvs_mes: obvsThisMonth || 0,
          ultimas_tareas: (tasks || []).map(t => ({
            titulo: t.titulo,
            completada: t.status === 'done',
          })),
          insights: insights || [],
        };
      })
    );

    const roleInfo = ROLE_INFO[role] || ROLE_INFO.operations;

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(roleInfo, membersWithContext, meetingType, duracionMinutos) },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content from AI');
    }

    // Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Parse error:', e);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions: parsed.questions || [],
        agenda_sugerida: parsed.agenda_sugerida,
        role: roleInfo.label,
        members_count: membersWithContext.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

const SYSTEM_PROMPT = `Eres un Facilitador de Reuniones de Alto Rendimiento experto en metodologías ágiles y coaching de equipos.

Tu misión es generar preguntas transformadoras con guías de facilitación para reuniones de rol.

PRINCIPIOS:
1. BASADAS EN DATOS: Cada pregunta surge de resultados específicos
2. GENERAN ACCIÓN: La discusión produce compromisos concretos
3. FOMENTAN VULNERABILIDAD: Permiten compartir fracasos y aprendizajes
4. TRANSFIEREN CONOCIMIENTO: Lo que funciona para uno llega a todos
5. TIEMPO-EFECTIVAS: Cada minuto genera valor

CATEGORÍAS:
- RESULTADOS: Celebrar victorias, analizar qué funcionó
- APRENDIZAJES: Compartir descubrimientos, identificar patrones
- DESAFIOS: Exponer bloqueos, buscar soluciones colectivas
- COLABORACION: Sinergias entre proyectos, compartir recursos
- MEJORA_CONTINUA: Evaluar procesos, proponer optimizaciones

FORMATO JSON:
{
  "questions": [
    {
      "pregunta": "string",
      "subtitulo": "string",
      "categoria": "resultados|aprendizajes|desafios|colaboracion|mejora_continua",
      "prioridad": 1|2|3,
      "tiempo_sugerido_minutos": number,
      "por_que_esta_pregunta": "string",
      "basada_en": "string (dato específico)",
      "guia": {
        "objetivo_de_la_pregunta": "string",
        "como_introducirla": "string",
        "preguntas_de_seguimiento": ["string"],
        "dinamica_sugerida": {
          "formato": "ronda|debate|brainstorm|caso_estudio|role_play",
          "descripcion": "string",
          "pasos": ["string"]
        },
        "que_buscar_en_respuestas": ["string"],
        "red_flags": ["string"],
        "como_cerrar": "string",
        "accion_resultante": "string"
      },
      "relacionada_con_miembros": ["nombre"]
    }
  ],
  "agenda_sugerida": {
    "apertura": "string",
    "desarrollo": "string",
    "cierre": "string"
  }
}`;

function buildPrompt(
  roleInfo: { label: string; description: string; kpis: string[] },
  members: any[],
  meetingType: string,
  duracion: number
) {
  return `
# CONTEXTO DE REUNIÓN DE ROL

## ROL: ${roleInfo.label}
- Descripción: ${roleInfo.description}
- KPIs: ${roleInfo.kpis.join(', ')}

## REUNIÓN
- Tipo: ${meetingType}
- Duración: ${duracion} minutos

## PARTICIPANTES (${members.length})

${members.map(m => `
### ${m.nombre} - Proyecto: ${m.project_nombre} (${m.project_fase})
- Tareas completadas esta semana: ${m.tareas_completadas_semana}
- Tareas pendientes: ${m.tareas_pendientes}
- OBVs del mes: ${m.obvs_mes}
- Últimas tareas: ${m.ultimas_tareas.map((t: any) => `${t.completada ? '✅' : '⏳'} ${t.titulo}`).join(', ') || 'Sin tareas'}
- Insights: ${m.insights.map((i: any) => `[${i.tipo}] ${i.titulo}`).join(', ') || 'Sin insights'}
`).join('\n---\n')}

---

# INSTRUCCIONES

Genera **5 preguntas de alta calidad** para ${duracion} minutos:
- 1 pregunta de RESULTADOS
- 1 pregunta de APRENDIZAJES  
- 1 pregunta de DESAFÍOS
- 1 pregunta de COLABORACIÓN
- 1 pregunta de MEJORA CONTINUA

Cada pregunta DEBE:
1. Estar basada en datos específicos de algún miembro
2. Incluir guía de facilitación completa
3. Tener tiempo estimado realista
4. Producir una acción concreta

Responde SOLO con JSON válido.
`;
}
