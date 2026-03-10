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
