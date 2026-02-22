/**
 * GENERATE TESTIMONIAL (AI)
 *
 * Auto-genera testimonial draft basado en feedback del beta tester
 * Usuario solo necesita aprobar/editar
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { betaTesterId } = await req.json();

    // Get beta tester data
    const { data: tester, error } = await supabaseClient
      .from('beta_testers')
      .select('*')
      .eq('id', betaTesterId)
      .single();

    if (error || !tester) {
      throw new Error('Beta tester not found');
    }

    if (!tester.feedback) {
      throw new Error('No feedback provided yet');
    }

    // Generate testimonial with AI
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    const prompt = `Eres un copywriter experto. Convierte este feedback en un testimonial convincente.

FEEDBACK DEL USUARIO:
"${tester.feedback}"

CONTEXT:
- Name: ${tester.name}
- Role: ${tester.role || 'User'}
- Company: ${tester.company || 'N/A'}
- Rating: ${tester.rating || 'N/A'}/5

Genera un testimonial que:
- Suene NATURAL (como lo diría ${tester.name})
- Específico (menciona features o resultados concretos)
- Credible (no over-the-top)
- 2-3 frases máximo
- Formato: "Como [role] en [company], [product] me ayudó a [specific result]. [Additional insight]."

EJEMPLOS:

✅ GOOD:
"Como Product Manager en una startup de 15 personas, pasábamos 3 horas semanales en meetings de planning. Con [Product], reducimos eso a 30 minutos. El setup de 1 minuto fue game-changer vs las 2 horas que tomó configurar Jira."

❌ BAD:
"[Product] is amazing! I love it! Best tool ever! 10/10 would recommend!!!"

Devuelve SOLO el testimonial (sin comillas, sin JSON, solo el texto):`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const testimonial = (message.content[0] as any).text.trim();

    // Save draft
    await supabaseClient
      .from('beta_testers')
      .update({
        testimonial_draft: testimonial,
      })
      .eq('id', betaTesterId);

    return new Response(
      JSON.stringify({
        success: true,
        testimonial,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
