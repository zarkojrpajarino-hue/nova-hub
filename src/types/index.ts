/**
 * EXPORTS CENTRALIZADOS DE TIPOS
 *
 * Usa este archivo para importar tipos en vez de importar directamente
 * desde integrations/supabase/types.ts
 */

// Exportar TODOS los tipos extendidos
export * from './database-extended';

// Re-exportar tipos originales de Supabase (para compatibilidad)
export type {
  Database,
  Tables,
  Enums,
  TablesInsert,
  TablesUpdate,
} from '@/integrations/supabase/types';
