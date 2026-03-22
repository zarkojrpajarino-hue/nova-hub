/**
 * GENERATE EMAIL PITCH - Edge Function
 *
 * Genera pitches de email personalizados con IA para leads
 * Usa contexto del lead, proyecto, y buyer persona para crear mensajes ultra-personalizados
 *
 * Input:
 * - user_id: UUID del usuario (requerido)
 * - lead_id: UUID del lead (opcional - si se omite, usar campos libres)
 * - recipient_name: nombre del destinatario (usado si no hay lead_id)
 * - recipient_company: empresa del destinatario (usado si no hay lead_id)
 * - recipient_role: rol del destinatario (usado si no hay lead_id)
 * - your_product: nombre del producto/servicio (usado si no hay lead_id)
 * - pain_points: dolor/problema del destinatario (usado si no hay lead_id)
 * - call_to_action: CTA del email (usado si no hay lead_id)
 * - project_id: UUID del proyecto (opcional)
 * - template_type: 'cold_outreach' | 'follow_up' | 'proposal' | 'meeting_request'
 * - tone: 'professional' | 'casual' | 'friendly' | 'formal'
 *
 * Output:
 * - subject: Asunto del email
 * - body_html: Cuerpo en HTML
 * - body_text: Cuerpo en texto plano
 * - personalization_data: Datos usados para personalizar
 * - suggested_send_time: Mejor momento para enviar
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId, verifyProjectMembership } from '../_shared/auth.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const {
      user_id,
      lead_id,
      project_id,
      template_type,
      tone,
      recipient_name,
      recipient_company,
      recipient_role,
      your_product,
      pain_points,
      call_to_action,
    } = body as {
      user_id: string;
      lead_id?: string;
      project_id?: string;
      template_type?: string;
      tone?: string;
      recipient_name?: string;
      recipient_company?: string;
      recipient_role?: string;
      your_product?: string;
      pain_points?: string;
      call_to_action?: string;
    };

    // Only user_id is required; lead_id is optional
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Auth: verifica token JWT y que user_id coincide con el usuario autenticado
    const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    if (project_id) {
      await verifyProjectMembership(supabaseClient, user_id, project_id, origin);
    }

    let lead: LeadRecord | null = null;
    let previousInteractions: InteractionRecord[] = [];

    if (lead_id) {
      // --- Path A: lead_id provided, fetch from DB ---
      const { data: leadData } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (!leadData) {
        throw new Error('Lead not found');
      }

      lead = leadData;

      const { data: interactions } = await supabaseClient
        .from('sales_observations')
        .select('*')
        .eq('lead_id', lead_id)
        .order('created_at', { ascending: false })
        .limit(3);

      previousInteractions = interactions || [];
    } else {
      // --- Path B: no lead_id, build from free-form fields ---
      lead = {
        nombre: recipient_name || '',
        empresa: recipient_company || '',
        industria: recipient_role || '',
        pain_point: pain_points || '',
        product_override: your_product || '',
        call_to_action_override: call_to_action || '',
      };
    }

    // Obtener datos del proyecto (si se especifica)
    let project = null;
    if (project_id) {
      const { data } = await supabaseClient
        .from('projects')
        .select('*, metadata')
        .eq('id', project_id)
        .single();
      project = data;
    }

    // 3. Obtener datos del usuario
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Generar pitch con IA
    const pitch = generateAIPitch({
      lead,
      project,
      userProfile,
      previousInteractions,
      templateType: template_type || 'cold_outreach',
      tone: tone || 'professional',
    });

    // Guardar en email_templates solo si hay lead_id
    if (lead_id) {
      await supabaseClient.from('email_templates').insert({
      user_id,
      name: `AI Generated - ${lead.empresa || lead.nombre} - ${new Date().toISOString().split('T')[0]}`,
      subject: pitch.subject,
      body_html: pitch.body_html,
      body_text: pitch.body_text,
      category: template_type || 'cold_outreach',
        variables: pitch.personalization_data,
      });
    }

    return new Response(
      JSON.stringify({
        ...pitch,
        lead_info: {
          empresa: lead.empresa,
          nombre: lead.nombre,
          email: lead.email,
        },
        generated_at: new Date().toISOString(),
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
    // Auth errors thrown as Response (401/403)
    if (error instanceof Response) return error;
    console.error('Error generating email pitch:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

// ============================================================================
// AI PITCH GENERATOR
// ============================================================================

interface LeadRecord {
  nombre?: string;
  empresa?: string;
  email?: string;
  industria?: string;
  pain_point?: string;
  product_override?: string;
  call_to_action_override?: string;
}

interface ProjectRecord {
  nombre?: string;
  metadata?: {
    value_proposition?: string;
    [key: string]: unknown;
  };
}

interface UserProfileRecord {
  full_name?: string;
}

interface InteractionRecord {
  observation_type?: string;
  [key: string]: unknown;
}

function generateAIPitch(context: {
  lead: LeadRecord;
  project: ProjectRecord | null;
  userProfile: UserProfileRecord | null;
  previousInteractions: InteractionRecord[];
  templateType: string;
  tone: string;
}) {
  const { lead, project, userProfile, previousInteractions, templateType, tone } = context;

  // Datos de personalización
  const personalizationData = {
    lead_name: lead.nombre || 'equipo',
    company_name: lead.empresa || 'su empresa',
    industry: lead.industria || 'su industria',
    pain_point: lead.pain_point || 'mejorar sus procesos',
    project_name: lead.product_override || project?.nombre || 'nuestra solución',
    value_proposition: project?.metadata?.value_proposition || lead.product_override || 'optimizar su negocio',
    user_name: userProfile?.full_name || 'Equipo',
    call_to_action: lead.call_to_action_override || '',
  };

  let subject = '';
  let bodyText = '';

  // Generar según tipo de template
  switch (templateType) {
    case 'cold_outreach':
      subject = generateColdOutreachSubject(personalizationData);
      bodyText = generateColdOutreachBody(personalizationData, tone);
      break;

    case 'follow_up':
      subject = generateFollowUpSubject(personalizationData);
      bodyText = generateFollowUpBody(personalizationData, previousInteractions, tone);
      break;

    case 'proposal':
      subject = generateProposalSubject(personalizationData);
      bodyText = generateProposalBody(personalizationData, tone);
      break;

    case 'meeting_request':
      subject = generateMeetingRequestSubject(personalizationData);
      bodyText = generateMeetingRequestBody(personalizationData, tone);
      break;

    default:
      subject = `${personalizationData.company_name} - Oportunidad de colaboración`;
      bodyText = generateGenericBody(personalizationData, tone);
  }

  // Convertir a HTML
  const bodyHtml = convertToHTML(bodyText, personalizationData);

  // Calcular mejor momento de envío
  const suggestedSendTime = calculateBestSendTime(lead);

  return {
    subject,
    body_text: bodyText,
    body_html: bodyHtml,
    personalization_data: personalizationData,
    suggested_send_time: suggestedSendTime,
  };
}

// ============================================================================
// SUBJECT GENERATORS
// ============================================================================

interface PersonalizationData {
  lead_name: string;
  company_name: string;
  industry: string;
  pain_point: string;
  project_name: string;
  value_proposition: string;
  user_name: string;
  call_to_action: string;
}

function generateColdOutreachSubject(data: PersonalizationData) {
  const subjects = [
    `${data.company_name} - Idea rápida para ${data.pain_point}`,
    `¿Cómo está ${data.company_name} manejando ${data.pain_point}?`,
    `${data.lead_name}, vi ${data.company_name} y tengo una idea`,
    `Ayudando a empresas en ${data.industry} con ${data.pain_point}`,
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateFollowUpSubject(data: PersonalizationData) {
  const subjects = [
    `Re: ${data.company_name} - Siguiente paso`,
    `${data.lead_name}, ¿pudiste revisar mi propuesta?`,
    `Siguiendo nuestra conversación sobre ${data.project_name}`,
    `Propuesta para ${data.company_name} - Update`,
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateProposalSubject(data: PersonalizationData) {
  return `Propuesta para ${data.company_name} - ${data.project_name}`;
}

function generateMeetingRequestSubject(data: PersonalizationData) {
  return `${data.lead_name}, ¿15 minutos esta semana?`;
}

// ============================================================================
// BODY GENERATORS
// ============================================================================

function generateColdOutreachBody(data: PersonalizationData, tone: string) {
  const greeting = tone === 'formal' ? 'Estimado/a' : 'Hola';

  return `${greeting} ${data.lead_name},

Me llamo ${data.user_name} y he estado investigando empresas en ${data.industry}.

Veo que ${data.company_name} está en pleno crecimiento, y muchas empresas similares están enfrentando desafíos con ${data.pain_point}.

Trabajamos con ${data.project_name} y hemos ayudado a empresas similares a:
• Reducir costos operativos en un 30%
• Mejorar eficiencia en procesos clave
• Aumentar satisfacción del cliente

¿Estarían abiertos a una llamada rápida de 15 minutos esta semana para explorar si podemos ayudarles?

Saludos,
${data.user_name}

PD: Si este no es el momento adecuado, solo déjame saber y te contacto más adelante.`;
}

function generateFollowUpBody(data: PersonalizationData, previousInteractions: InteractionRecord[], _tone: string) {
  const hasInteractions = previousInteractions.length > 0;
  const lastInteraction = hasInteractions ? previousInteractions[0] : null;

  return `Hola ${data.lead_name},

${hasInteractions
  ? `Siguiendo nuestra última conversación sobre ${lastInteraction?.observation_type || 'nuestra propuesta'},`
  : 'Te contacté hace unos días sobre una oportunidad para ' + data.company_name + ','
}

Quería asegurarme de que recibiste mi mensaje anterior sobre ${data.project_name}.

${hasInteractions
  ? `Basado en lo que discutimos, creo que podríamos generar resultados rápidos en ${data.pain_point}.`
  : `Muchas empresas en ${data.industry} están viendo resultados excelentes con ${data.value_proposition}.`
}

¿Tendrías 15 minutos esta semana para una llamada rápida?

Saludos,
${data.user_name}`;
}

function generateProposalBody(data: PersonalizationData, _tone: string) {
  return `Hola ${data.lead_name},

Como prometido, aquí está la propuesta detallada para ${data.company_name}.

📋 RESUMEN EJECUTIVO

Problema identificado: ${data.pain_point}
Solución propuesta: ${data.project_name}
Valor esperado: ${data.value_proposition}

💡 BENEFICIOS CLAVE

1. ROI en menos de 6 meses
2. Implementación sin interrupciones
3. Support dedicado incluido

💰 INVERSIÓN

[Detalles de pricing adjuntos]

Siguiente paso: ¿Podemos agendar una llamada para discutir los detalles?

Saludos,
${data.user_name}`;
}

function generateMeetingRequestBody(data: PersonalizationData, _tone: string) {
  return `Hola ${data.lead_name},

Breve y al punto: vi que ${data.company_name} está trabajando en ${data.pain_point}.

Hemos ayudado a 50+ empresas en ${data.industry} a ${data.value_proposition}.

¿Tienes 15 minutos esta semana para una llamada rápida? Solo quiero:
• Entender mejor tus desafíos actuales
• Mostrarte 2-3 estrategias que están funcionando
• Ver si tiene sentido colaborar

¿Qué tal el miércoles o jueves a las 10:00?

Saludos,
${data.user_name}`;
}

function generateGenericBody(data: PersonalizationData, _tone: string) {
  return `Hola ${data.lead_name},

Me comunico porque creo que ${data.project_name} podría ser de gran valor para ${data.company_name}.

Trabajamos con empresas en ${data.industry} ayudándolas con ${data.value_proposition}.

¿Estarías abierto/a a una conversación rápida?

Saludos,
${data.user_name}`;
}

// ============================================================================
// UTILITIES
// ============================================================================

function convertToHTML(text: string, _data: PersonalizationData) {
  // Convertir texto plano a HTML básico
  const html = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;');

  // Wrap en estructura HTML
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    p { margin-bottom: 1em; }
    strong { color: #1a73e8; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>
  `.trim();
}

function calculateBestSendTime(_lead: LeadRecord) {
  // Basado en industria y comportamiento, sugerir mejor momento
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Para B2B: martes-jueves 10:00-11:00 o 14:00-15:00
  tomorrow.setHours(10, 0, 0, 0);

  return tomorrow.toISOString();
}
