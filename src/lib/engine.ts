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
