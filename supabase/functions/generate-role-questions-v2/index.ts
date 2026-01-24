import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for nested Supabase query results
interface ProfileNested {
  id: string;
  nombre: string;
}

interface ProjectNested {
  nombre: string;
  fase: string;
}

interface ProjectMemberWithRelations {
  member_id: string;
  role: string;
  project_id: string;
  projects: ProjectNested;
  profiles: ProfileNested;
}

interface TaskData {
  titulo: string;
  status: string;
  completed_at: string | null;
}

interface InsightData {
  tipo: string;
  titulo: string;
  contenido: string;
}

interface MemberContext {
  id: string;
  nombre: string;
  project_nombre: string;
  project_fase: string;
  tareas_completadas_semana: number;
  tareas_pendientes: number;
  obvs_mes: number;
  ultimas_tareas: { titulo: string; completada: boolean }[];
  insights: { tipo: string; titulo: string }[];
}

// Valid roles for validation
const VALID_ROLES = ['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'leader', 'customer'];

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

// Sanitize text input to prevent prompt injection
function sanitizeText(input: unknown, maxLength: number): string {
  return String(input || '')
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
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

    const { role, meetingType = 'semanal', duracionMinutos = 30 } = await req.json();
    
    // Validate role input
    const roleName = String(role || '').toLowerCase().slice(0, 50);
    if (!roleName || !VALID_ROLES.includes(roleName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate other inputs
    const sanitizedMeetingType = sanitizeText(meetingType, 50);
    const sanitizedDuration = Math.min(Math.max(Number(duracionMinutos) || 30, 15), 180);

    // Use service role for data queries
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating questions for role:', roleName);

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
      .eq('role', roleName) as { data: ProjectMemberWithRelations[] | null; error: unknown };

    if (membersError) {
      console.error('Error fetching members');
      return new Response(
        JSON.stringify({ error: 'Unable to fetch role members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ questions: [], message: 'No members with this role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get context for each member (limit to first 10)
    const membersWithContext = await Promise.all(
      members.slice(0, 10).map(async (m): Promise<MemberContext> => {
        const memberId = m.member_id;

        // Recent tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('titulo, status, completed_at')
          .eq('assignee_id', memberId)
          .order('created_at', { ascending: false })
          .limit(5) as { data: TaskData[] | null };

        // Recent insights
        const { data: insights } = await supabase
          .from('user_insights')
          .select('tipo, titulo, contenido')
          .eq('user_id', memberId)
          .order('created_at', { ascending: false })
          .limit(3) as { data: InsightData[] | null };

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
          nombre: sanitizeText(m.profiles.nombre, 100),
          project_nombre: sanitizeText(m.projects.nombre, 100),
          project_fase: sanitizeText(m.projects.fase, 50),
          tareas_completadas_semana: completedThisWeek || 0,
          tareas_pendientes: pendingTasks || 0,
          obvs_mes: obvsThisMonth || 0,
          ultimas_tareas: (tasks || []).slice(0, 5).map((t: TaskData) => ({
            titulo: sanitizeText(t.titulo, 100),
            completada: t.status === 'done',
          })),
          insights: (insights || []).slice(0, 3).map((i: InsightData) => ({
            tipo: sanitizeText(i.tipo, 50),
            titulo: sanitizeText(i.titulo, 100),
          })),
        };
      })
    );

    const roleInfo = ROLE_INFO[roleName] || ROLE_INFO.operations;

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Unable to generate questions at this time' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          { role: 'user', content: buildPrompt(roleInfo, membersWithContext, sanitizedMeetingType, sanitizedDuration) },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Unable to generate questions at this time' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Parse error');
      return new Response(
        JSON.stringify({ error: 'Failed to process AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    console.error('Error in generate-role-questions-v2:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate questions at this time' }),
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
  members: MemberContext[],
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
- Últimas tareas: ${m.ultimas_tareas.map(t => `${t.completada ? '✅' : '⏳'} ${t.titulo}`).join(', ') || 'Sin tareas'}
- Insights: ${m.insights.map(i => `[${i.tipo}] ${i.titulo}`).join(', ') || 'Sin insights'}
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
