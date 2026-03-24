/**
 * GENERATE TESTIMONIAL (AI)
 *
 * Auto-genera testimonial draft basado en feedback del beta tester
 * Usuario solo necesita aprobar/editar
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';


serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
        const { user, serviceClient: supabaseClient } = await validateAuth(req);

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

    await verifyProjectMembership(supabaseClient, user.id, tester.project_id, origin);

    if (!tester.feedback) {
      throw new Error('No feedback provided yet');
    }

    // Sanitize tester name and company inputs
    const sanitizedName = sanitizePromptInput(tester.name || '', SanitizerPresets.SHORT_INPUT);
    if (sanitizedName.blocked) {
      throw new Error(`Invalid tester name: ${sanitizedName.reason}`);
    }
    const sanitizedCompany = sanitizePromptInput(tester.company || 'N/A', SanitizerPresets.SHORT_INPUT);
    if (sanitizedCompany.blocked) {
      throw new Error(`Invalid company name: ${sanitizedCompany.reason}`);
    }
    const sanitizedFeedback = sanitizePromptInput(tester.feedback, SanitizerPresets.LONG_INPUT);
    if (sanitizedFeedback.blocked) {
      throw new Error(`Invalid feedback: ${sanitizedFeedback.reason}`);
    }

    const safeName = sanitizedName.sanitized;
    const safeCompany = sanitizedCompany.sanitized;
    const safeFeedback = sanitizedFeedback.sanitized;
    const feedbackWordCount = safeFeedback.split(/\s+/).length;

    // Generate testimonial with AI
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    const prompt = `Eres un editor de texto. Tu trabajo es PULIR el feedback existente, NO inventar contenido nuevo.

REGLAS ESTRICTAS — VIOLACIONES INACEPTABLES:
1. NUNCA inventes claims, features o resultados que NO estén en el feedback original.
2. NUNCA añadas números, métricas o porcentajes a menos que aparezcan LITERALMENTE en el feedback original.
3. Si el feedback es corto (menos de 20 palabras), devuélvelo TAL CUAL con correcciones gramaticales mínimas.
4. Máximo 3 frases. Usa el mismo nivel de vocabulario que el hablante.
5. NO exageres, NO embellezcan, NO añadas superlativos que no estén en el original.
6. Mantén el tono y estilo del hablante original.

FEEDBACK ORIGINAL (${feedbackWordCount} palabras):
"${safeFeedback}"

CONTEXT:
- Name: ${safeName}
- Role: ${tester.role || 'User'}
- Company: ${safeCompany}
- Rating: ${tester.rating || 'N/A'}/5

${feedbackWordCount < 20 ? 'IMPORTANTE: El feedback tiene menos de 20 palabras. Devuélvelo TAL CUAL con correcciones gramaticales mínimas.' : 'Puedes reorganizar las ideas del feedback para mayor claridad, pero NO añadas información que no esté en el original.'}

Al final del testimonial, añade SIEMPRE en una línea separada:
[Draft IA — verificar con ${safeName} antes de publicar]

Devuelve SOLO el testimonial + disclaimer (sin comillas, sin JSON, solo el texto):`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // [SCALE] Downgrade: testimonial is template-based, Haiku suffices
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    let testimonial = (message.content[0] as { type: string; text: string }).text.trim();

    // Ensure disclaimer is always present
    const disclaimer = `[Draft IA — verificar con ${safeName} antes de publicar]`;
    if (!testimonial.includes('[Draft IA')) {
      testimonial = `${testimonial}\n\n${disclaimer}`;
    }

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
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
