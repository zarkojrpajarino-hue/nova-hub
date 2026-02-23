/**
 * AI TASK ROUTER - UNICORN FEATURE 🦄
 *
 * Clasifica tareas automáticamente y determina qué AI Worker usar
 * Usa NLP para detectar el tipo de tarea y routear al executor correcto
 *
 * Input:
 * - user_id: UUID del usuario
 * - task_id: UUID de la tarea
 * - task_description: Descripción de la tarea
 * - project_context: Contexto del proyecto (opcional)
 *
 * Output:
 * - worker_type: Tipo de worker recomendado
 * - template_id: Template sugerido (si aplica)
 * - execution_params: Parámetros extraídos automáticamente
 * - estimated_credits: Créditos que consumirá
 * - can_execute: Si el usuario puede ejecutar (límites)
 * - requires_approval: Si necesita aprobación manual
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, task_id: _task_id, task_description, project_context: _project_context } = await req.json();

    if (!user_id || !task_description) {
      throw new Error('user_id and task_description are required');
    }

        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    // 1. Clasificar la tarea usando NLP
    const classification = classifyTask(task_description);

    // 2. Obtener worker recomendado
    const { data: worker } = await supabaseClient
      .from('ai_workers')
      .select('*')
      .eq('worker_type', classification.recommended_worker)
      .eq('is_active', true)
      .single();

    if (!worker) {
      throw new Error('No suitable AI worker found for this task');
    }

    // 3. Verificar si usuario puede ejecutar
    const { data: canExecuteResult } = await supabaseClient.rpc('can_execute_ai_task', {
      p_user_id: user_id,
      p_credits_needed: worker.credit_cost_per_execution,
    });

    // 4. Buscar template apropiado
    const { data: template } = await supabaseClient
      .from('task_execution_templates')
      .select('*')
      .eq('worker_type', worker.worker_type)
      .eq('is_active', true)
      .order('success_rate', { ascending: false })
      .limit(1)
      .single();

    // 5. Extraer parámetros de la descripción
    const extractedParams = extractExecutionParams(task_description, classification);

    // 6. Si requiere aprobación, crear registro de aprobación
    let approvalId = null;
    if (canExecuteResult.requires_approval) {
      const { data: approval } = await supabaseClient
        .from('execution_approvals')
        .insert({
          user_id,
          preview_data: {
            task_description,
            worker: worker.display_name,
            classification: classification.task_type,
            extracted_params: extractedParams,
          },
          estimated_credits: worker.credit_cost_per_execution,
          estimated_time_seconds: worker.avg_execution_time_seconds,
          status: 'pending',
        })
        .select()
        .single();

      approvalId = approval?.id;
    }

    return new Response(
      JSON.stringify({
        classification: {
          task_type: classification.task_type,
          confidence: classification.confidence,
          detected_intent: classification.intent,
        },
        worker: {
          type: worker.worker_type,
          name: worker.display_name,
          description: worker.description,
          capabilities: worker.capabilities,
        },
        template: template ? {
          id: template.id,
          name: template.template_name,
          industry: template.industry,
        } : null,
        execution_params: extractedParams,
        estimated_cost: {
          credits: worker.credit_cost_per_execution,
          time_seconds: worker.avg_execution_time_seconds,
        },
        can_execute: canExecuteResult.can_execute,
        requires_approval: canExecuteResult.requires_approval,
        approval_id: approvalId,
        limits: {
          credits_remaining: canExecuteResult.credits_remaining,
          executions_remaining: canExecuteResult.executions_remaining,
          plan: canExecuteResult.plan,
        },
        next_step: canExecuteResult.can_execute
          ? (canExecuteResult.requires_approval
            ? 'approve_execution'
            : 'execute_task')
          : 'upgrade_plan',
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error in AI Task Router:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

// ============================================================================
// TASK CLASSIFICATION ENGINE
// ============================================================================

interface TaskClassification {
  task_type: string;
  recommended_worker: string;
  confidence: number;
  intent: string;
}

function classifyTask(description: string): TaskClassification {
  const desc = description.toLowerCase();

  // Lead Generation / Scraping
  if (
    desc.includes('buscar') && (desc.includes('cliente') || desc.includes('lead') || desc.includes('negocio')) ||
    desc.includes('encontrar') && desc.includes('empresas') ||
    desc.includes('scraping') ||
    desc.includes('extraer') && desc.includes('contacto')
  ) {
    return {
      task_type: 'lead_generation',
      recommended_worker: 'lead_scraper',
      confidence: 0.9,
      intent: 'Find and extract potential customer information',
    };
  }

  // Email Campaign / Outreach
  if (
    desc.includes('email') || desc.includes('correo') ||
    desc.includes('campaña') && (desc.includes('mail') || desc.includes('mensaje')) ||
    desc.includes('escribir') && desc.includes('cliente') ||
    desc.includes('pitch')
  ) {
    // Si menciona múltiples emails o campaña = campaign builder
    if (desc.match(/\d+\s*(email|correo)/i) || desc.includes('campaña')) {
      return {
        task_type: 'email_campaign',
        recommended_worker: 'email_campaign_builder',
        confidence: 0.85,
        intent: 'Create multi-email campaign with scheduling',
      };
    }
    // Si es un solo email = email generator
    return {
      task_type: 'email_generation',
      recommended_worker: 'email_generator',
      confidence: 0.9,
      intent: 'Generate single personalized email',
    };
  }

  // Design / Flyer / Visual Content
  if (
    desc.includes('diseñ') || desc.includes('flyer') || desc.includes('banner') ||
    desc.includes('imagen') || desc.includes('post') && (desc.includes('instagram') || desc.includes('facebook')) ||
    desc.includes('crear') && (desc.includes('visual') || desc.includes('gráfico'))
  ) {
    return {
      task_type: 'design_generation',
      recommended_worker: 'design_generator',
      confidence: 0.85,
      intent: 'Generate visual design with code/templates',
    };
  }

  // LinkedIn Outreach
  if (
    desc.includes('linkedin') ||
    desc.includes('conectar') && desc.includes('profesional') ||
    desc.includes('red') && desc.includes('contacto')
  ) {
    return {
      task_type: 'linkedin_outreach',
      recommended_worker: 'linkedin_outreach',
      confidence: 0.8,
      intent: 'LinkedIn connection and messaging',
    };
  }

  // Call Scripts / Phone Outreach
  if (
    desc.includes('llamar') || desc.includes('llamada') ||
    desc.includes('teléfono') || desc.includes('telefono') ||
    desc.includes('script') && desc.includes('venta')
  ) {
    return {
      task_type: 'call_script',
      recommended_worker: 'call_script_generator',
      confidence: 0.8,
      intent: 'Generate call script with objection handling',
    };
  }

  // Content Writing / Copywriting
  if (
    desc.includes('escribir') || desc.includes('redactar') ||
    desc.includes('contenido') || desc.includes('copy') ||
    desc.includes('artículo') || desc.includes('articulo') ||
    desc.includes('blog')
  ) {
    return {
      task_type: 'content_writing',
      recommended_worker: 'text_writer',
      confidence: 0.75,
      intent: 'Write text content or copy',
    };
  }

  // Default: Task Analyzer (analiza y recomienda)
  return {
    task_type: 'task_analysis',
    recommended_worker: 'task_analyzer',
    confidence: 0.6,
    intent: 'Analyze task and suggest execution plan',
  };
}

// ============================================================================
// PARAMETER EXTRACTION
// ============================================================================

function extractExecutionParams(description: string, classification: TaskClassification): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  // Extraer cantidad (números)
  const quantityMatch = description.match(/(\d+)\s*(cliente|lead|email|negocio|empresa)/i);
  if (quantityMatch) {
    params.quantity = parseInt(quantityMatch[1]);
  }

  // Extraer ubicación
  const locationMatch = description.match(/en\s+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?)/i);
  if (locationMatch) {
    params.location = locationMatch[1];
  }

  // Extraer industria
  const industries = ['restaurante', 'cafetería', 'gimnasio', 'retail', 'saas', 'tecnología', 'inmobiliaria'];
  for (const industry of industries) {
    if (description.toLowerCase().includes(industry)) {
      params.industry = industry;
      break;
    }
  }

  // Extraer tono (para emails/mensajes)
  if (description.toLowerCase().includes('profesional')) {
    params.tone = 'professional';
  } else if (description.toLowerCase().includes('casual') || description.toLowerCase().includes('amigable')) {
    params.tone = 'casual';
  }

  // Extraer tipo de diseño
  if (classification.task_type === 'design_generation') {
    if (description.includes('flyer')) params.design_type = 'flyer';
    if (description.includes('post')) params.design_type = 'social_post';
    if (description.includes('banner')) params.design_type = 'banner';
  }

  return params;
}
