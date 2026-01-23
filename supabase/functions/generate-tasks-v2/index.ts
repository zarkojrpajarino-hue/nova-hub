import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Role labels for display
const ROLE_LABELS: Record<string, string> = {
  sales: 'Customer (Ventas)',
  customer: 'Customer (Ventas)',
  marketing: 'Marketing',
  operations: 'Operations',
  leader: 'Team Leader',
  strategy: 'Strategy',
  finance: 'Finance',
  ai_tech: 'AI/Tech',
};

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

    const { projectId } = await req.json();
    
    // Validate input
    if (!projectId || typeof projectId !== 'string' || projectId.length > 36) {
      return new Response(
        JSON.stringify({ error: 'Invalid project ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for data operations
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating tasks for project:', projectId);

    // 1. Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get team members with profiles
    const { data: teamMembers, error: teamError } = await supabase
      .from('project_members')
      .select(`
        member_id,
        role,
        role_responsibilities,
        profiles!inner(id, nombre, email, especialization)
      `)
      .eq('project_id', projectId);

    if (teamError || !teamMembers || teamMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No team members found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get metrics for each member
    const teamWithMetrics = await Promise.all(
      teamMembers.map(async (tm) => {
        const memberId = tm.member_id;
        
        // Get task stats
        const { count: completedTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', memberId)
          .eq('status', 'done');

        // Get OBV stats
        const { count: validatedObvs } = await supabase
          .from('obvs')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', memberId)
          .eq('status', 'validated');

        return {
          id: memberId,
          nombre: (tm.profiles as any).nombre,
          role: tm.role || 'operations',
          roleLabel: ROLE_LABELS[tm.role || 'operations'] || tm.role,
          especialization: (tm.profiles as any).especialization,
          tareas_completadas_mes: completedTasks || 0,
          obvs_validadas_mes: validatedObvs || 0,
        };
      })
    );

    // 4. Get project metrics
    const { data: obvs } = await supabase
      .from('obvs')
      .select('tipo, status, facturacion, titulo, fecha')
      .eq('project_id', projectId);

    const { data: leads } = await supabase
      .from('leads')
      .select('nombre, empresa, status')
      .eq('project_id', projectId);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('titulo, status, assignee_id, completed_at')
      .eq('project_id', projectId);

    // 5. Build context
    const context = buildContext(project, teamWithMetrics, obvs || [], leads || [], tasks || []);

    // 6. Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Unable to generate tasks at this time' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling AI with context for', teamWithMetrics.length, 'members');

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
          { role: 'user', content: buildUserPrompt(context) },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Unable to generate tasks at this time' }),
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

    console.log('AI response received, parsing...');

    // 7. Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Parse error, content preview:', cleanContent.substring(0, 200));
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedTasks = parsed.tasks || [];
    console.log('Parsed', generatedTasks.length, 'tasks');

    // 8. Save tasks to database
    const savedTasks = [];
    for (const task of generatedTasks) {
      const member = teamWithMetrics.find(m => 
        m.nombre.toLowerCase().includes(task.assignee_nombre?.toLowerCase()) ||
        task.assignee_nombre?.toLowerCase().includes(m.nombre.split(' ')[0].toLowerCase())
      );
      
      if (!member) {
        console.warn('Member not found for task:', task.assignee_nombre);
        continue;
      }

      // Calculate fecha_limite (3-5 days from now)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + (task.prioridad === 1 ? 3 : task.prioridad === 2 ? 4 : 5));

      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          assignee_id: member.id,
          titulo: String(task.titulo || '').slice(0, 200),
          descripcion: String(task.descripcion_corta || '').slice(0, 1000),
          prioridad: task.prioridad || 2,
          fecha_limite: task.fecha_limite || fechaLimite.toISOString().split('T')[0],
          playbook: task.playbook || null,
          metadata: {
            tipo_tarea: task.tipo_tarea,
            tiempo_estimado_horas: task.tiempo_estimado_horas,
            por_que_esta_tarea: task.por_que_esta_tarea,
            resultado_esperado: task.resultado_esperado,
            como_medir_exito: task.como_medir_exito,
          },
          tipo_tarea: task.tipo_tarea,
          tiempo_estimado_horas: task.tiempo_estimado_horas,
          ai_generated: true,
          status: 'todo',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting task');
      } else {
        savedTasks.push(newTask);
      }
    }

    console.log('Saved', savedTasks.length, 'tasks');

    return new Response(
      JSON.stringify({ 
        success: true, 
        tasks: savedTasks,
        generated: generatedTasks.length,
        saved: savedTasks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-tasks-v2:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate tasks at this time' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// System prompt for task generation
const SYSTEM_PROMPT = `Eres un Director de Operaciones y Coach de Startups de élite con experiencia en McKinsey, Y Combinator y scaling de startups.

Tu misión es generar tareas con playbooks de ejecución profesional.

PRINCIPIOS:
1. ESPECIFICIDAD EXTREMA: Cada tarea debe ser clara y accionable
2. PLAYBOOK ACCIONABLE: Guía completa para ejecutar sin experiencia previa
3. CONTEXTO COMPLETO: Considera rol, proyecto y métricas
4. RECURSOS REALES: Herramientas y plantillas útiles
5. MEDIBLE: Resultados verificables

REGLAS POR ROL:
- CUSTOMER/SALES: Prospección, llamadas, demos, cierres. Scripts de venta.
- MARKETING: Contenido, campañas, branding. Frameworks de copywriting.
- OPERATIONS: Documentación, automatización. SOPs y checklists.
- LEADER/STRATEGY: Planificación, 1:1s, decisiones. Frameworks de decisión.
- FINANCE: Control presupuesto, pricing, facturación.
- AI_TECH: Automatizaciones, integraciones, desarrollo.

FORMATO DE RESPUESTA (JSON válido):
{
  "tasks": [
    {
      "assignee_nombre": "string",
      "assignee_role": "string",
      "titulo": "string (máx 80 chars)",
      "descripcion_corta": "string (máx 200 chars)",
      "tipo_tarea": "exploracion|validacion|ejecucion|analisis|comunicacion",
      "prioridad": 1|2|3,
      "fecha_limite": "YYYY-MM-DD",
      "tiempo_estimado_horas": number,
      "por_que_esta_tarea": "string",
      "resultado_esperado": "string",
      "como_medir_exito": "string",
      "playbook": {
        "resumen_ejecutivo": "string",
        "preparacion": {
          "antes_de_empezar": ["string"],
          "materiales_necesarios": ["string"],
          "conocimientos_previos": ["string"]
        },
        "pasos": [
          {
            "numero": number,
            "titulo": "string",
            "descripcion": "string",
            "tiempo_estimado": "string",
            "tips": ["string"],
            "errores_comunes": ["string"]
          }
        ],
        "herramientas": [
          {
            "nombre": "string",
            "url": "string (opcional)",
            "para_que": "string",
            "alternativa": "string (opcional)"
          }
        ],
        "recursos": [
          {
            "tipo": "plantilla|guia|ejemplo",
            "titulo": "string",
            "descripcion": "string",
            "contenido": "string (opcional)"
          }
        ],
        "script_sugerido": "string (opcional, para comunicación)",
        "preguntas_clave": ["string (opcional)"],
        "checklist_final": ["string"],
        "siguiente_paso": "string"
      }
    }
  ]
}`;

function buildContext(project: any, team: any[], obvs: any[], leads: any[], tasks: any[]) {
  const onboarding = project.onboarding_data || {};
  
  return {
    project: {
      nombre: String(project.nombre || '').slice(0, 200),
      descripcion: String(project.descripcion || '').slice(0, 500),
      fase: project.fase || 'validacion',
      tipo: project.tipo || 'validacion',
    },
    onboarding: {
      problema: String(onboarding.problema || onboarding.problema_resuelve || 'No definido').slice(0, 500),
      cliente_objetivo: String(onboarding.cliente_objetivo || 'No definido').slice(0, 500),
      solucion: String(onboarding.solucion_propuesta || onboarding.solucion || 'No definida').slice(0, 500),
      hipotesis: Array.isArray(onboarding.hipotesis) ? onboarding.hipotesis.slice(0, 5).join(', ') : 'No definidas',
      metricas: String(onboarding.metricas_exito || 'No definidas').slice(0, 300),
    },
    team,
    metrics: {
      obvs_total: obvs.length,
      obvs_validadas: obvs.filter(o => o.status === 'validated').length,
      obvs_pendientes: obvs.filter(o => o.status === 'pending').length,
      leads_total: leads.length,
      leads_calientes: leads.filter(l => l.status === 'caliente' || l.status === 'propuesta_enviada').length,
      tareas_pendientes: tasks.filter(t => t.status !== 'done').length,
      tareas_completadas: tasks.filter(t => t.status === 'done').length,
    },
    history: {
      ultimas_obvs: obvs.slice(0, 5).map(o => ({ tipo: o.tipo, titulo: String(o.titulo || '').slice(0, 100) })),
      ultimos_leads: leads.slice(0, 5).map(l => ({ 
        nombre: String(l.nombre || '').slice(0, 50), 
        empresa: String(l.empresa || '').slice(0, 50), 
        status: l.status 
      })),
    },
  };
}

function buildUserPrompt(context: any) {
  return `
# CONTEXTO DEL PROYECTO

## PROYECTO: ${context.project.nombre}
- Descripción: ${context.project.descripcion}
- Fase: ${context.project.fase}
- Tipo: ${context.project.tipo}

## MODELO DE NEGOCIO
- Problema: ${context.onboarding.problema}
- Cliente objetivo: ${context.onboarding.cliente_objetivo}
- Solución: ${context.onboarding.solucion}
- Hipótesis: ${context.onboarding.hipotesis}
- Métricas de éxito: ${context.onboarding.metricas}

## EQUIPO (${context.team.length} miembros)
${context.team.map((m: any) => `
- **${m.nombre}** - Rol: ${m.roleLabel}
  - Especialización: ${m.especialization || 'No definida'}
  - Tareas completadas: ${m.tareas_completadas_mes}
  - OBVs validadas: ${m.obvs_validadas_mes}
`).join('')}

## MÉTRICAS ACTUALES
- OBVs: ${context.metrics.obvs_total} total (${context.metrics.obvs_validadas} validadas, ${context.metrics.obvs_pendientes} pendientes)
- Leads: ${context.metrics.leads_total} total (${context.metrics.leads_calientes} calientes)
- Tareas: ${context.metrics.tareas_completadas} completadas, ${context.metrics.tareas_pendientes} pendientes

## ACTIVIDAD RECIENTE
### Últimas OBVs
${context.history.ultimas_obvs.map((o: any) => `- [${o.tipo}] ${o.titulo}`).join('\n') || 'Sin OBVs recientes'}

### Leads recientes
${context.history.ultimos_leads.map((l: any) => `- ${l.nombre} (${l.empresa || 'Sin empresa'}) - ${l.status}`).join('\n') || 'Sin leads recientes'}

---

# INSTRUCCIONES

Genera **exactamente 1 tarea por cada miembro del equipo** (${context.team.length} tareas).

Cada tarea debe:
1. Ser la MÁS IMPORTANTE para ese rol esta semana
2. Incluir un PLAYBOOK COMPLETO con mínimo 4 pasos detallados
3. Tener herramientas reales con URLs cuando sea posible
4. Incluir checklist de verificación
5. Fecha límite entre hoy y 5 días

Responde SOLO con JSON válido.
`;
}
