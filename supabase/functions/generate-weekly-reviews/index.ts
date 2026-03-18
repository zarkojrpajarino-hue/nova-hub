/**
 * GENERATE WEEKLY REVIEWS (Edge Function)
 *
 * Wrapper HTTP para la función SQL generate_all_weekly_reviews().
 * Puede invocarse manualmente desde el dashboard de Supabase o via HTTP.
 * El pg_cron llama directamente a la SQL function — sin necesitar este endpoint.
 *
 * POST /functions/v1/generate-weekly-reviews
 * Authorization: Bearer <service_role_key>
 * Body (opcional): { project_id: string }  → genera solo para ese proyecto
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { serviceClient } = await validateAuth(req);

    let body: { project_id?: string } = {};
    if (req.method === 'POST') {
      try { body = await req.json(); } catch { /* empty body ok */ }
    }

    if (body.project_id) {
      // Generar solo para un proyecto específico
      const { error } = await serviceClient.rpc(
        'generate_weekly_review_for_project',
        { p_project_id: body.project_id }
      );
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, project_id: body.project_id }),
        { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // Generar para todos los proyectos activos
    const { error } = await serviceClient.rpc('generate_all_weekly_reviews');
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error) {
    if (error instanceof Response) return error;
    const err = error as Error;
    console.error('generate-weekly-reviews failed:', err);

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
