/**
 * EQ26.11 — generate-hiring-guidance
 *
 * Genera guía de contratación para un rol específico:
 * - Rango salarial por mercado
 * - Equity guidance por stage
 * - Canales de hiring
 * - Preguntas de entrevista
 * - Red flags
 * - Alternativas (freelancer/herramienta)
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const body = await req.json();
    const { projectId, roleName } = body as { projectId: string; roleName: string };

    if (!projectId || !roleName) {
      return new Response(JSON.stringify({ error: 'projectId and roleName required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // Get project context
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user is a member of the project
    const authUserId = claims.claims.sub;
    const { data: memberCheck } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('member_id', (await supabase.from('profiles').select('id').eq('auth_id', authUserId).single()).data?.id ?? '')
      .maybeSingle();

    if (!memberCheck) {
      return new Response(JSON.stringify({ error: 'Not a member of this project' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('nombre, country, onboarding_data')
      .eq('id', projectId)
      .single();

    const { data: phaseState } = await supabase
      .from('project_phase_state')
      .select('current_phase')
      .eq('project_id', projectId)
      .maybeSingle();

    const country = project?.country || 'España';
    const phase = phaseState?.current_phase ?? 1;
    const stageLabel = phase <= 1 ? 'pre-seed/seed' : phase <= 3 ? 'early-stage' : 'growth';

    const systemPrompt = `Eres un experto en hiring para startups. Genera guía de contratación.

RESPONDE SOLO con JSON válido:
{
  "salary_range": { "min": number, "max": number, "currency": "EUR", "period": "monthly" },
  "equity_guidance": "string (% típico para este stage)",
  "hiring_channels": ["string"],
  "interview_questions": ["string"],
  "red_flags": ["string"],
  "alternative": "string (qué hacer si no puede contratar)"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',  // [B6] Downgrade: hiring es lookup+template, Haiku basta
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Proyecto: ${project?.nombre}. País: ${country}. Stage: ${stageLabel}. Rol a contratar: ${roleName}. Genera la guía de contratación.`,
        }],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Error generating guidance' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text ?? '';

    let guidance;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      guidance = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: 'Error parsing AI response' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // [B10] Validate salary_range is reasonable
    const salary = guidance?.salary_range;
    if (salary) {
      if (salary.min < 500 || salary.max > 30000) {
        salary.min = Math.max(500, salary.min);
        salary.max = Math.min(30000, salary.max);
      }
      if (salary.min > salary.max) {
        const tmp = salary.min;
        salary.min = salary.max;
        salary.max = tmp;
      }
    }

    return new Response(JSON.stringify({ success: true, guidance }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });

  } catch (error: unknown) {
    console.error('Error in generate-hiring-guidance:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
  }
});
