import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Project, TeamMember, EnrichedTeamMember, OBV, Lead, Task, ProjectContext } from './types.ts';
import { TasksGenerationRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { EvidenceMetricsTracker } from '../_shared/evidence-instrumentation.ts';


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
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

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
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authSupabase.auth.getClaims(token);
    
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
      'generate-tasks-v2',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = await validateRequestSafe(TasksGenerationRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const { projectId } = validation.data;

    // Use service role for data operations (bypasses RLS for cross-table reads)
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Generating tasks for project:', projectId);

    // ==================== EVIDENCE INSTRUMENTATION ====================
    const evidenceMode = (validation.data as Record<string, unknown>).evidence_mode as string || 'hypothesis';
    const evidenceTracker = new EvidenceMetricsTracker(
      'task_generation',
      'tasks',
      evidenceMode,
      authUserId,
      projectId
    );
    // ==================================================================

    // 1. CHECK GLOBAL LIMITS before generating
    const { data: canCreate, error: limitError } = await supabase.rpc('can_execute_task', {
      p_user_id: authUserId,
      p_is_ai_execution: false,
    });

    if (limitError || !canCreate) {
      return new Response(
        JSON.stringify({ error: 'Failed to check limits' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    if (!canCreate.can_execute) {
      return new Response(
        JSON.stringify({
          error: canCreate.reason,
          limits: canCreate.limits,
          message: 'Límite de tareas alcanzado. Vuelve mañana o espera hasta la próxima semana.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // ==================== EVIDENCE: START RETRIEVAL ====================
    evidenceTracker.startRetrieval();
    // ==================================================================

    // 2. Get project data (including user_stage for adaptive task generation)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, nombre, descripcion, fase, tipo, onboarding_data, project_state, user_stage, methodology')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // [F23] P23.3 — Get current phase from project_phase_state (source of truth)
    const { data: phaseState } = await supabase
      .from('project_phase_state')
      .select('current_phase, entry_mode, graduated')
      .eq('project_id', projectId)
      .maybeSingle();
    const currentPhase: number = phaseState?.current_phase ?? 1;

    // Authorization: Verify user is a member of this project
    // First get the member_id from the authenticated user's auth_id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', authUserId)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const memberId = userProfile.id;

    // Now verify user is a member of this project
    const { data: userMembership, error: membershipError } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('member_id', memberId)
      .single();

    if (membershipError || !userMembership) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not a member of this project' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
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
      .eq('project_id', projectId) as { data: TeamMember[] | null; error: unknown };

    if (teamError || !teamMembers || teamMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No team members found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 3. Get metrics for each member
    const teamWithMetrics = await Promise.all(
      teamMembers.map(async (tm: TeamMember) => {
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
          member_id: memberId,
          nombre: tm.profiles.nombre,
          email: tm.profiles.email,
          role: tm.role || 'operations',
          roleLabel: ROLE_LABELS[tm.role || 'operations'] || tm.role,
          especialization: tm.profiles.especialization,
          role_responsibilities: typeof tm.role_responsibilities === 'string' 
            ? tm.role_responsibilities 
            : null,
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

    // 5. Get Project Intelligence for rich context
    const { data: intelligence, error: intelligenceError } = await supabase.rpc('get_project_intelligence', {
      p_project_id: projectId,
    });

    if (intelligenceError) {
      console.warn('Failed to get project intelligence:', intelligenceError);
    }

    // 6. Build context (now with intelligence)
    const context = buildContext(project, teamWithMetrics, obvs || [], leads || [], tasks || [], intelligence, currentPhase);

    // ==================== EVIDENCE: END RETRIEVAL, START GENERATION ====================
    const sourcesFound = [
      project ? 1 : 0,
      teamWithMetrics.length,
      obvs?.length || 0,
      leads?.length || 0,
      tasks?.length || 0,
      intelligence ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    const retrievalTime = evidenceTracker.endRetrieval(sourcesFound);
    evidenceTracker.recordTierDuration('internal_data', retrievalTime);

    evidenceTracker.startGeneration();
    // ==================================================================

    // 7. Call AI
    const ANTHROPIC_API_KEY = requireEnv('ANTHROPIC_API_KEY');

    console.log('Calling Claude API with context for', teamWithMetrics.length, 'members');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt(context) }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Unable to generate tasks at this time' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('AI response received, parsing...');

    // 8. Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (_e) {
          if (error instanceof Response) return error;
console.error('Parse error, content preview:', cleanContent.substring(0, 200));
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const generatedTasks = parsed.tasks || [];
    console.log('Parsed', generatedTasks.length, 'tasks');

    // 9. Save tasks to database
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
          assignee_id: member.member_id,
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
            // [V24.5] Phase impact — conecta tarea con avance de fase
            ...(task.phase_impact ? { phase_impact: task.phase_impact } : {}),
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

    // ==================== EVIDENCE: END GENERATION & LOG METRICS ====================
    evidenceTracker.endGeneration(0); // No sources cited in task generation

    // Determine evidence status based on context quality
    if (sourcesFound >= 5 && intelligence) {
      evidenceTracker.setEvidenceStatus('verified');
    } else if (sourcesFound >= 3) {
      evidenceTracker.setEvidenceStatus('partial');
    } else {
      evidenceTracker.setEvidenceStatus('no_evidence');
    }

    // Metadata
    evidenceTracker.metadata = {
      tasks_generated: generatedTasks.length,
      tasks_saved: savedTasks.length,
      team_size: teamWithMetrics.length,
      project_phase: currentPhase,
      has_intelligence: !!intelligence,
      context_sources: sourcesFound,
      coverage_percentage: (savedTasks.length / generatedTasks.length) * 100,
    };

    const generationId = await evidenceTracker.finish(supabase);
    console.log(`[Evidence] Logged generation: ${generationId}`);
    // ==================================================================

    return new Response(
      JSON.stringify({
        success: true,
        tasks: savedTasks,
        generated: generatedTasks.length,
        saved: savedTasks.length,
        generation_id: generationId,
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error: unknown) {
        if (error instanceof Response) return error;
console.error('Error in generate-tasks-v2:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate tasks at this time' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
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
      "phase_impact": {
        "phase": number,
        "objective": "string (ej. O1.1, O2.3)",
        "contribution": "string (cómo esta tarea impacta el avance de fase)"
      },
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

function buildContext(
  project: Project,
  team: EnrichedTeamMember[],
  obvs: OBV[],
  leads: Lead[],
  tasks: Task[],
  intelligence: Record<string, unknown> | null = null,
  currentPhase: number = 1
): ProjectContext {
  const onboarding = project.onboarding_data || {};

  return {
    project: {
      nombre: String(project.nombre || '').slice(0, 200),
      descripcion: String(project.descripcion || '').slice(0, 500),
      fase: project.fase || 'validacion',
      tipo: project.tipo || 'validacion',
      project_state: project.project_state || null,
      user_stage: (project as Record<string, unknown>).user_stage as string || null,
      methodology: (project as Record<string, unknown>).methodology as string || null,
      current_phase: currentPhase,
    },
    intelligence: intelligence || {
      buyer_personas: [],
      value_proposition: null,
      brand: null,
      competitors: [],
      knowledge: null,
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
      obvs_validadas: obvs.filter((o: OBV) => o.status === 'validated').length,
      obvs_pendientes: obvs.filter((o: OBV) => o.status === 'pending').length,
      leads_total: leads.length,
      leads_calientes: leads.filter((l: Lead) => l.status === 'caliente' || l.status === 'propuesta_enviada').length,
      tareas_pendientes: tasks.filter((t: Task) => t.status !== 'done').length,
      tareas_completadas: tasks.filter((t: Task) => t.status === 'done').length,
    },
    history: {
      ultimas_obvs: obvs.slice(0, 5).map((o: OBV) => ({ tipo: o.tipo, titulo: String(o.titulo || '').slice(0, 100) })),
      ultimos_leads: leads.slice(0, 5).map((l: Lead) => ({
        nombre: String(l.nombre || '').slice(0, 50),
        empresa: String(l.empresa || '').slice(0, 50),
        status: l.status
      })),
    },
  };
}

// [F23] P23.3 — Unified phase instructions (replaces getUserStageInstructions + getStateInstructions)
function getPhaseInstructions(phase: number): string {
  switch (phase) {
    case 0:
      return `
📍 **FASE 0 — EXPLORACIÓN** - Pre-idea, descubrimiento de oportunidades

**ENFOQUE**: Exploración de intereses, problemas y oportunidades.

**TAREAS IDEALES**:
- Identificar hobbies y skills únicos del usuario
- Analizar problemas en su entorno y red
- Entrevistas informales con personas de su industria
- Investigar tendencias y oportunidades emergentes
- Generar ideas de negocio (llamar a generate-business-ideas si no se ha hecho)
- Validar interés personal en cada idea

**NO SUGERIR**:
- ❌ Tareas de producto, ventas o desarrollo
- ❌ Análisis de mercado profundo (aún no tiene idea)
- ❌ Definir buyer persona o value prop (no hay idea)
- ❌ Construir MVP o landing pages

**PRIORIDAD**: Encontrar una idea que le APASIONE y resuelva un problema REAL.
`;

    case 1:
      return `
📍 **FASE 1 — VALIDACIÓN DE PROBLEMA** - Tiene idea, validar dolor real

**ENFOQUE**: Validación de problema y solución antes de construir.

**TAREAS IDEALES**:
- Entrevistas con clientes potenciales (mínimo 20-30 personas)
- Landing page para captar emails y medir interés
- Encuestas de validación (willingness to pay, frecuencia del problema)
- Análisis de competencia y alternativas actuales
- Prototipos de baja fidelidad (sketches, Figma mockups)
- Tests de precio (qué pagarían, cuánto, cuándo)
- Validation experiments (ejecutar experimentos de la tabla)
- Definir MVP mínimo viable

**NO SUGERIR**:
- ❌ Contratar equipo o escalar operaciones
- ❌ Campañas de marketing con presupuesto >€500
- ❌ Desarrollo técnico complejo (aún no validado)
- ❌ Procesos de venta B2B largos
- ❌ Features avanzadas

**PRIORIDAD**: Validar PROBLEMA antes que solución. Evidencia de "dolor real" > idea bonita.
`;

    case 2:
      return `
📍 **FASE 2 — VALIDACIÓN DE SOLUCIÓN** - Primeros clientes (1-10 clientes, €0-1k/mes)

**ENFOQUE**: Product-Market Fit, retención early adopters, feedback loops.

**TAREAS IDEALES**:
- Mejorar onboarding (reducir time-to-value)
- Entrevistas deep-dive con usuarios actuales
- Implementar métricas básicas (engagement, retención, NPS)
- Optimizar core value proposition basado en feedback
- Identificar y eliminar puntos de fricción
- Documentar casos de éxito tempranos (testimonios)
- Analizar por qué cancelan usuarios (exit interviews)
- Iterar features más usadas (doblar down en lo que funciona)

**NO SUGERIR**:
- ❌ Escalar adquisición sin PMF claro
- ❌ Contratar equipo grande (máximo 1-2 personas)
- ❌ Expansión a nuevos segmentos/mercados
- ❌ Complicar producto con features "nice to have"
- ❌ Volver a validar problema (ya está validado con clientes reales)

**PRIORIDAD**: RETENER a los clientes actuales. PMF > Growth. Calidad > Cantidad.
`;

    case 3:
      return `
📍 **FASE 3 — REVENUE** (10-100 clientes, €1-10k/mes)

**ENFOQUE**: Escalar operaciones, optimizar unit economics, growth loops.

**TAREAS IDEALES**:
- Optimizar CAC (reducir coste de adquisición)
- Mejorar LTV mediante upsell, cross-sell, retención
- Automatizar procesos repetitivos (emails, onboarding, cobros)
- Implementar canales de adquisición escalables (SEO, content, ads)
- Mejorar tasa de conversión (funnel optimization)
- Documentar procesos (SOPs para escalar sin depender de founders)
- Contratar roles críticos si burn rate lo permite
- Analizar cohorts y métricas de retención por segmento
- Preparar pitch deck y materiales de fundraising
- Implementar referral program

**NO SUGERIR**:
- ❌ Validación básica de problema/solución (hace tiempo validado)
- ❌ Features sin impacto en métricas clave (north star metric)
- ❌ Expansión prematura sin unit economics saludables
- ❌ Procesos manuales que no escalan

**PRIORIDAD**: Unit economics saludables (LTV:CAC > 3:1). Crecer de forma sostenible.
`;

    case 4:
      return `
📍 **FASE 4 — CRECIMIENTO** (100+ clientes, €10k+/mes)

**ENFOQUE**: Expansión estratégica, optimización de margen, team building senior.

**TAREAS IDEALES**:
- Expansión a nuevos mercados/verticales/geografías
- Optimizar Net Revenue Retention (target >110%)
- Partnerships estratégicos y canales indirectos (resellers, integraciones)
- Contratar liderazgo senior (VP Sales, VP Eng, VP Marketing)
- Preparar fundraising (Serie A/B) si aplica
- Análisis de M&A o buy-build-partner decisions
- Lanzar nuevo pricing tier o producto complementario
- Implementar OKRs y procesos de gobernanza
- Explorar economías de escala (reducir COGS)
- Defender contra competencia (moats, patents, network effects)

**NO SUGERIR**:
- ❌ Validación de problema/solución (hace años validado)
- ❌ MVPs o experimentos de bajo presupuesto
- ❌ Tareas tácticas que debería hacer un junior/mid
- ❌ Procesos manuales (todo debe estar automatizado o delegado)
- ❌ Análisis básico de métricas (debe ser avanzado: cohorts, LTV by segment, etc.)

**PRIORIDAD**: Escala y expansión. Defenderse de competencia. Margen y eficiencia operativa.
`;

    default:
      return `
📍 **FASE NO DEFINIDA**

Genera tareas generales de startup considerando la fase y tipo del proyecto.
`;
  }
}

function buildUserPrompt(context: ProjectContext): string {
  const project = context.project;
  const currentPhase = project.current_phase ?? 1;

  // [F23] P23.3 — Use current_phase as single source of truth for instructions
  const stateInstructions = getPhaseInstructions(currentPhase);

  // Extract intelligence context
  const intelligence = (context.intelligence as Record<string, unknown>) || {};
  const primaryPersona = (intelligence.buyer_personas as Record<string, unknown>[])?.[0];
  const valueProp = intelligence.value_proposition as Record<string, unknown> | undefined;
  const brand = intelligence.brand as Record<string, unknown> | undefined;

  return `
# CONTEXTO DEL PROYECTO

## PROYECTO: ${context.project.nombre}
- Descripción: ${context.project.descripcion}
- Fase del Motor: ${currentPhase} (0=Exploración, 1=Validación problema, 2=Validación solución, 3=Revenue, 4=Crecimiento)
- Tipo: ${context.project.tipo}

${stateInstructions}

${primaryPersona ? `
## BUYER PERSONA PRIMARY
- Nombre: ${primaryPersona.persona_name}
- Rol: ${primaryPersona.role || 'No definido'}
- Pain points principales: ${(primaryPersona.pain_points as Array<Record<string, unknown>>)?.slice(0, 3).map((p) => (p.pain as string) || String(p)).join(', ') || 'No definidos'}
- Presupuesto: €${primaryPersona.budget_min}-${primaryPersona.budget_max} ${primaryPersona.budget_frequency || ''}
- Canales preferidos: ${(primaryPersona.preferred_channels as Array<Record<string, unknown>>)?.map((c) => (c.channel as string) || String(c)).join(', ') || 'No definidos'}
` : ''}

${valueProp ? `
## VALUE PROPOSITION
- Headline: ${valueProp.headline}
- USPs clave: ${(valueProp.unique_selling_points as Array<Record<string, unknown>>)?.slice(0, 3).map((u) => (u.usp as string) || String(u)).join(', ') || 'No definidos'}
` : ''}

${brand ? `
## BRAND TONE
- Atributos de tono: ${brand.tone_attributes?.join(', ') || 'No definidos'}
- Palabras preferidas: ${brand.preferred_words?.slice(0, 5).join(', ') || 'No definidas'}
` : ''}

## MODELO DE NEGOCIO
- Problema: ${context.onboarding.problema}
- Cliente objetivo: ${context.onboarding.cliente_objetivo}
- Solución: ${context.onboarding.solucion}
- Hipótesis: ${context.onboarding.hipotesis}
- Métricas de éxito: ${context.onboarding.metricas}

## EQUIPO (${context.team.length} miembros)
${context.team.map((m: EnrichedTeamMember) => `
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
${context.history.ultimas_obvs.map((o: { tipo: string; titulo: string }) => `- [${o.tipo}] ${o.titulo}`).join('\n') || 'Sin OBVs recientes'}

### Leads recientes
${context.history.ultimos_leads.map((l: { nombre: string; empresa: string; status: string }) => `- ${l.nombre} (${l.empresa || 'Sin empresa'}) - ${l.status}`).join('\n') || 'Sin leads recientes'}

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
