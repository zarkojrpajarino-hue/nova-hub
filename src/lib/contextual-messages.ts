/**
 * contextual-messages.ts — AUD.M.10
 *
 * buildContextualMessage() adapta frases del sistema según el contexto del proyecto:
 * sector, tipo de negocio y mercado declarados en onboarding_data.
 *
 * Uso: pasar como `contextual_hint` a edge functions del toolkit o como
 * texto de soporte en notificaciones y next-action descriptions.
 *
 * Diseño:
 *   - Sin dependencias de React — función pura de string.
 *   - onboarding_data puede ser null → retorna la frase genérica.
 *   - Extensible: añadir más claves a SECTOR_HINTS / MODEL_HINTS según necesidad.
 */

// ── Tipos de entrada ──────────────────────────────────────────────────────────

export interface ProjectOnboardingContext {
  sector?: string | null;
  tipo?: string | null;       // 'saas' | 'service' | 'marketplace' | 'agency' | 'physical' | etc.
  mercado?: string | null;    // 'b2b' | 'b2c' | 'b2b2c' | etc.
  descripcion?: string | null;
}

// ── Hints por contexto ────────────────────────────────────────────────────────

const SECTOR_HINTS: Record<string, string> = {
  fintech:    'En fintech, la confianza y el cumplimiento regulatorio son señales de validación tan importantes como el MRR.',
  healthtech: 'En healthtech, la validación clínica y los ciclos de ventas largos son esperables en fase temprana.',
  edtech:     'En edtech, la retención del alumno a los 30 días es el indicador más predictivo de crecimiento.',
  saas:       'Para SaaS, el churn mensual es el termómetro más honesto de product-market fit real.',
  marketplace:'En marketplaces, el problema de arranque (gallina-huevo) es la señal de validación más importante.',
  ecommerce:  'Para ecommerce, el margen por unidad y el coste de adquisición determinan si el modelo es viable.',
  agencia:    'Para agencias, la recurrencia de clientes y el ticket promedio definen el techo del negocio.',
};

const MODEL_HINTS: Record<string, string> = {
  saas:        'Modelo SaaS: el MRR recurrente es la métrica que más importa al motor. Conecta ingresos para mejorar la precisión.',
  service:     'Modelo de servicio: la tasa de conversión de leads y el ciclo de ventas son tus señales clave.',
  marketplace: 'Modelo marketplace: GMV y tasa de transacción son los inputs más valiosos que puedes añadir.',
  agency:      'Modelo de agencia: facturación por cliente y tasa de renovación son tus indicadores de salud.',
  physical:    'Producto físico: margen bruto y rotación de inventario alimentan directamente el score del motor.',
};

const MARKET_HINTS: Record<string, string> = {
  b2b:   'En B2B, un solo cliente de referencia bien documentado vale más que 10 conversaciones informales.',
  b2c:   'En B2C, la viralidad orgánica y la retención son señales más fiables que los surveys de intención.',
  b2b2c: 'En B2B2C, el éxito del canal B2B es prerequisito antes de escalar el B2C.',
};

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Construye un mensaje contextual adaptado al proyecto.
 *
 * @param context  - datos de onboarding del proyecto (puede ser null/undefined)
 * @param fallback - texto genérico si no hay contexto suficiente
 * @returns        - string con el hint más relevante, o el fallback
 */
export function buildContextualMessage(
  context: ProjectOnboardingContext | null | undefined,
  fallback: string,
): string {
  if (!context) return fallback;

  const sector  = context.sector?.toLowerCase().trim() ?? '';
  const tipo    = context.tipo?.toLowerCase().trim() ?? '';
  const mercado = context.mercado?.toLowerCase().trim() ?? '';

  // Prioridad: sector → tipo → mercado → fallback
  if (sector && SECTOR_HINTS[sector]) return SECTOR_HINTS[sector];
  if (tipo   && MODEL_HINTS[tipo])    return MODEL_HINTS[tipo];
  if (mercado && MARKET_HINTS[mercado]) return MARKET_HINTS[mercado];

  return fallback;
}

/**
 * Devuelve TODOS los hints disponibles para el contexto del proyecto.
 * Útil para enriquecer prompts de edge functions con contexto completo.
 */
export function buildContextualHints(
  context: ProjectOnboardingContext | null | undefined,
): string[] {
  if (!context) return [];
  const hints: string[] = [];

  const sector  = context.sector?.toLowerCase().trim() ?? '';
  const tipo    = context.tipo?.toLowerCase().trim() ?? '';
  const mercado = context.mercado?.toLowerCase().trim() ?? '';

  if (sector  && SECTOR_HINTS[sector])   hints.push(SECTOR_HINTS[sector]);
  if (tipo    && MODEL_HINTS[tipo])       hints.push(MODEL_HINTS[tipo]);
  if (mercado && MARKET_HINTS[mercado])   hints.push(MARKET_HINTS[mercado]);

  return hints;
}
