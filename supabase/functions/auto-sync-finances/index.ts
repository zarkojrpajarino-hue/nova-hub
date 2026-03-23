// ZOMBIE: DEPRECATED. Replaced by sync-stripe/sync-hubspot/sync-asana. Returns 410 Gone. Safe to delete. (Audit: 2026-03-23)
/**
 * AUTO SYNC FINANCES — DEPRECADO
 *
 * Esta función fue reemplazada por el sistema de integraciones I15:
 *   - sync-stripe    → transacciones y suscripciones de Stripe
 *   - sync-hubspot   → deals y pipeline de HubSpot
 *   - sync-asana     → tareas y ejecución de Asana
 *
 * Motivo de deprecación: todos los providers usaban generateMockTransactions()
 * con datos ficticios en producción. El sistema I15 usa SDKs reales y escribe
 * en integration_entities → agentes → motor de fases.
 *
 * NO LLAMAR. Retorna error 410 Gone.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  return new Response(
    JSON.stringify({
      deprecated: true,
      reason: 'Replaced by I15 sync system: use sync-stripe, sync-hubspot or sync-asana instead.',
      since: '2026-03-20',
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    }
  );
});
