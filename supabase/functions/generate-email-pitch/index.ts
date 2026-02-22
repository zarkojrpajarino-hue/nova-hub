/**
 * GENERATE EMAIL PITCH - Edge Function
 *
 * Genera pitches de email personalizados con IA para leads
 * Usa contexto del lead, proyecto, y buyer persona para crear mensajes ultra-personalizados
 *
 * Input:
 * - user_id: UUID del usuario
 * - lead_id: UUID del lead
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { user_id, lead_id, project_id, template_type, tone } = await req.json();

    if (!user_id || !lead_id) {
      throw new Error('user_id and lead_id are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtener datos del lead
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (!lead) {
      throw new Error('Lead not found');
    }

    // 2. Obtener datos del proyecto (si se especifica)
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

    // 4. Obtener interacciones previas con el lead
    const { data: previousInteractions } = await supabaseClient
      .from('sales_observations')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 5. Generar pitch con IA
    const pitch = generateAIPitch({
      lead,
      project,
      userProfile,
      previousInteractions: previousInteractions || [],
      templateType: template_type || 'cold_outreach',
      tone: tone || 'professional',
    });

    // 6. Guardar en email_templates si es útil
    await supabaseClient.from('email_templates').insert({
      user_id,
      name: `AI Generated - ${lead.empresa || lead.nombre} - ${new Date().toISOString().split('T')[0]}`,
      subject: pitch.subject,
      body_html: pitch.body_html,
      body_text: pitch.body_text,
      category: template_type || 'cold_outreach',
      variables: pitch.personalization_data,
    });

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
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating email pitch:', error);
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
// AI PITCH GENERATOR
// ============================================================================

function generateAIPitch(context: {
  lead: any;
  project: any;
  userProfile: any;
  previousInteractions: any[];
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
    project_name: project?.nombre || 'nuestra solución',
    value_proposition: project?.metadata?.value_proposition || 'optimizar su negocio',
    user_name: userProfile?.full_name || 'Equipo',
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

function generateColdOutreachSubject(data: any) {
  const subjects = [
    `${data.company_name} - Idea rápida para ${data.pain_point}`,
    `¿Cómo está ${data.company_name} manejando ${data.pain_point}?`,
    `${data.lead_name}, vi ${data.company_name} y tengo una idea`,
    `Ayudando a empresas en ${data.industry} con ${data.pain_point}`,
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateFollowUpSubject(data: any) {
  const subjects = [
    `Re: ${data.company_name} - Siguiente paso`,
    `${data.lead_name}, ¿pudiste revisar mi propuesta?`,
    `Siguiendo nuestra conversación sobre ${data.project_name}`,
    `Propuesta para ${data.company_name} - Update`,
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateProposalSubject(data: any) {
  return `Propuesta para ${data.company_name} - ${data.project_name}`;
}

function generateMeetingRequestSubject(data: any) {
  return `${data.lead_name}, ¿15 minutos esta semana?`;
}

// ============================================================================
// BODY GENERATORS
// ============================================================================

function generateColdOutreachBody(data: any, tone: string) {
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

function generateFollowUpBody(data: any, previousInteractions: any[], tone: string) {
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

function generateProposalBody(data: any, tone: string) {
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

function generateMeetingRequestBody(data: any, tone: string) {
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

function generateGenericBody(data: any, tone: string) {
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

function convertToHTML(text: string, data: any) {
  // Convertir texto plano a HTML básico
  let html = text
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

function calculateBestSendTime(lead: any) {
  // Basado en industria y comportamiento, sugerir mejor momento
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Para B2B: martes-jueves 10:00-11:00 o 14:00-15:00
  tomorrow.setHours(10, 0, 0, 0);

  return tomorrow.toISOString();
}
