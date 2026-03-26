/**
 * Constantes compartidas del Phase Engine.
 * Fuente de verdad para etiquetas de fase y mapeos de UI.
 *
 * No importar desde aquí lógica de negocio — solo presentación.
 * La lógica vive en las migraciones SQL (migration 00005–00018).
 */

export const PHASE_LABELS: Record<number, string> = {
  0: 'Exploración',
  1: 'Validación de problema',
  2: 'Validación de solución',
  3: 'Revenue',
  4: 'Crecimiento',
};

// [V24.7] Metodología asignada automáticamente por fase
export const PHASE_METHODOLOGY: Record<number, string> = {
  0: 'Exploración libre',
  1: 'Lean Startup — Customer Discovery',
  2: 'Lean Startup — Product-Market Fit',
  3: 'Operaciones — Unit Economics',
  4: 'Scaling Up — Crecimiento estructurado',
};

export const PHASE_DESCRIPTIONS: Record<number, string> = {
  0: 'Fase de exploración: descubrir intereses, identificar problemas reales y seleccionar una idea de negocio.',
  1: 'El objetivo es identificar y validar el problema real que el proyecto resuelve.',
  2: 'En esta fase el objetivo es validar que la solución genera demanda real en el mercado.',
  3: 'El proyecto entra en operación y debe demostrar que el modelo genera ingresos sostenibles.',
  4: 'El modelo está validado. El objetivo es consolidar la operación y escalar de forma sostenible.',
};

// Methodology detail — focus per role + key principle per phase
export const PHASE_METHODOLOGY_DETAIL: Record<number, {
  focus: { founder: string; growth: string; operations: string };
  principle: string;
}> = {
  0: {
    focus: {
      founder: 'Descubre un problema que valga la pena',
      growth: 'Investiga qué busca el mercado',
      operations: 'Organiza la investigación',
    },
    principle: 'No elijas solución antes de entender el problema',
  },
  1: {
    focus: {
      founder: 'Valida que el problema es real y frecuente',
      growth: 'Consigue señales de demanda reales',
      operations: 'Facilita que el equipo valide rápido',
    },
    principle: 'Habla con clientes antes de construir',
  },
  2: {
    focus: {
      founder: 'Demuestra que tu solución activa y retiene a los primeros usuarios',
      growth: 'Convierte interés en activaciones reales',
      operations: 'Estructura los procesos de activación',
    },
    principle: 'Activación antes que retención',
  },
  3: {
    focus: {
      founder: 'Demuestra que el modelo genera margen',
      growth: 'Escala solo los canales que ya son rentables',
      operations: 'Controla costes, entrega y cobro sin fricción',
    },
    principle: 'Si no es rentable unitariamente, escalar lo empeora',
  },
  4: {
    focus: {
      founder: 'Delega y sistematiza lo que funciona',
      growth: 'Multiplica los canales validados',
      operations: 'Automatiza procesos repetitivos',
    },
    principle: 'Escala lo que ya funciona, no lo que esperas que funcione',
  },
};

/**
 * i18n-aware phase labels. Use this hook in components instead of importing PHASE_LABELS directly.
 * Falls back to Spanish constants if i18n is not available.
 */
export function getPhaseLabelsI18n(t: (key: string) => string): Record<number, string> {
  return {
    0: t('phases.labels.0') || PHASE_LABELS[0],
    1: t('phases.labels.1') || PHASE_LABELS[1],
    2: t('phases.labels.2') || PHASE_LABELS[2],
    3: t('phases.labels.3') || PHASE_LABELS[3],
    4: t('phases.labels.4') || PHASE_LABELS[4],
  };
}

export function getPhaseDescriptionsI18n(t: (key: string) => string): Record<number, string> {
  return {
    0: t('phases.descriptions.0') || PHASE_DESCRIPTIONS[0],
    1: t('phases.descriptions.1') || PHASE_DESCRIPTIONS[1],
    2: t('phases.descriptions.2') || PHASE_DESCRIPTIONS[2],
    3: t('phases.descriptions.3') || PHASE_DESCRIPTIONS[3],
    4: t('phases.descriptions.4') || PHASE_DESCRIPTIONS[4],
  };
}

export function getPhaseMethodologyI18n(t: (key: string) => string): Record<number, string> {
  return {
    0: t('phases.methodology.0') || PHASE_METHODOLOGY[0],
    1: t('phases.methodology.1') || PHASE_METHODOLOGY[1],
    2: t('phases.methodology.2') || PHASE_METHODOLOGY[2],
    3: t('phases.methodology.3') || PHASE_METHODOLOGY[3],
    4: t('phases.methodology.4') || PHASE_METHODOLOGY[4],
  };
}
