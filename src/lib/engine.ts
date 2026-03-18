/**
 * Constantes compartidas del Phase Engine.
 * Fuente de verdad para etiquetas de fase y mapeos de UI.
 *
 * No importar desde aquí lógica de negocio — solo presentación.
 * La lógica vive en las migraciones SQL (migration 00005–00018).
 */

export const PHASE_LABELS: Record<number, string> = {
  1: 'Validación de problema',
  2: 'Validación de solución',
  3: 'Revenue',
  4: 'Crecimiento',
};

export const PHASE_DESCRIPTIONS: Record<number, string> = {
  1: 'El objetivo es identificar y validar el problema real que el proyecto resuelve.',
  2: 'En esta fase el objetivo es validar que la solución genera demanda real en el mercado.',
  3: 'El proyecto entra en operación y debe demostrar que el modelo genera ingresos sostenibles.',
  4: 'El modelo está validado. El objetivo es consolidar la operación y escalar de forma sostenible.',
};
