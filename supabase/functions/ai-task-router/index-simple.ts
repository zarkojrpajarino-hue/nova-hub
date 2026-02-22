/**
 * AI TASK ROUTER - VERSIÓN SIMPLIFICADA
 *
 * Clasifica tareas automáticamente y determina qué AI Worker usar
 * SIN sistema de créditos/planes - Solo verifica límites globales (5/día, 35/semana)
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
 * - can_execute: Si el usuario puede ejecutar (límites globales)
 * - usage_info: Uso actual y límites
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { user_id, task_id, task_description, project_context } = await req.json();

    if (!user_id || !task_description) {
      throw new Error('user_id and task_description are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // 3. Verificar límites globales
    const { data: canExecuteResult } = await supabaseClient.rpc('can_execute_task', {
      p_user_id: user_id,
      p_is_ai_execution: true,
    });

    // 4. Buscar template apropiado
    const { data: template } = await supabaseClient
      .from('task_execution_templates')
      .select('*')
      .eq('worker_type', worker.worker_type)
      .eq('is_active', true)
      .order('success_rate', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Extraer parámetros de la descripción
    const extractedParams = extractExecutionParams(task_description, classification);

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
        estimated_time: {
          seconds: worker.avg_execution_time_seconds,
          display: `${Math.ceil(worker.avg_execution_time_seconds / 60)} minutos`,
        },
        can_execute: canExecuteResult.can_execute,
        usage: canExecuteResult.limits,
        next_step: canExecuteResult.can_execute ? 'execute_task' : 'limit_reached',
        limit_message: canExecuteResult.reason,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in AI Task Router:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// TASK CLASSIFICATION ENGINE (IGUAL QUE ANTES)
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
    if (desc.match(/\d+\s*(email|correo)/i) || desc.includes('campaña')) {
      return {
        task_type: 'email_campaign',
        recommended_worker: 'email_campaign_builder',
        confidence: 0.85,
        intent: 'Create multi-email campaign with scheduling',
      };
    }
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

  // Default: Task Analyzer
  return {
    task_type: 'task_analysis',
    recommended_worker: 'task_analyzer',
    confidence: 0.6,
    intent: 'Analyze task and suggest execution plan',
  };
}

// ============================================================================
// PARAMETER EXTRACTION (IGUAL QUE ANTES)
// ============================================================================

function extractExecutionParams(description: string, classification: TaskClassification): any {
  const params: any = {};

  const quantityMatch = description.match(/(\d+)\s*(cliente|lead|email|negocio|empresa)/i);
  if (quantityMatch) {
    params.quantity = parseInt(quantityMatch[1]);
  }

  const locationMatch = description.match(/en\s+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?)/i);
  if (locationMatch) {
    params.location = locationMatch[1];
  }

  const industries = ['restaurante', 'cafetería', 'gimnasio', 'retail', 'saas', 'tecnología', 'inmobiliaria'];
  for (const industry of industries) {
    if (description.toLowerCase().includes(industry)) {
      params.industry = industry;
      break;
    }
  }

  if (description.toLowerCase().includes('profesional')) {
    params.tone = 'professional';
  } else if (description.toLowerCase().includes('casual') || description.toLowerCase().includes('amigable')) {
    params.tone = 'casual';
  }

  if (classification.task_type === 'design_generation') {
    if (description.includes('flyer')) params.design_type = 'flyer';
    if (description.includes('post')) params.design_type = 'social_post';
    if (description.includes('banner')) params.design_type = 'banner';
  }

  return params;
}
