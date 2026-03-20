/**
 * optimus.ts — AUD.B.1
 *
 * Zod schema para validar el output JSON de Optimus en runtime.
 * Schema inamovible: refleja §4 de OPTIMUS_PROMPTS.md.
 *
 * Uso:
 *   import { parseOptimus, type OptimusOutput } from '@/lib/optimus';
 *   const result = parseOptimus(rawJson);
 *   if (!result.success) { // usar fallback }
 *   else { // render result.data }
 *
 * El schema NO valida el input (construido internamente).
 * Solo valida el output antes de renderizarlo en el componente.
 */

import { z } from 'zod';

// --- Schema pieces ---

const ConfidenceLevel = z.enum(['high', 'medium', 'low']);

const PrimarySchema = z.object({
  action: z.string().min(1),
  reason: z.string().min(1),
  signal_basis: z.string().min(1),
  invalidation_condition: z.string().min(1),
  confidence: ConfidenceLevel,
});

const AlternativeSchema = z.object({
  action: z.string().min(1),
  reason: z.string().min(1),
  confidence: ConfidenceLevel,
});

// --- Root schema (§4 Output Schema — inamovible) ---

export const OptimusOutputSchema = z.object({
  primary: PrimarySchema,
  alternative: AlternativeSchema.nullable(),
});

export type OptimusOutput = z.infer<typeof OptimusOutputSchema>;
export type OptimusPrimary = z.infer<typeof PrimarySchema>;
export type OptimusAlternative = z.infer<typeof AlternativeSchema>;
export type OptimusConfidence = z.infer<typeof ConfidenceLevel>;

// --- Runtime parser with fallback ---

export type OptimusParseResult =
  | { success: true; data: OptimusOutput }
  | { success: false; error: string; raw: unknown };

/**
 * Parsea y valida el output JSON de Optimus.
 * Retorna { success: false } si el JSON es inválido o no cumple el schema.
 * El consumidor debe mostrar un fallback UI en ese caso.
 *
 * @param raw - el valor crudo de la respuesta del LLM (ya parseado desde JSON.parse o como objeto)
 */
export function parseOptimus(raw: unknown): OptimusParseResult {
  const result = OptimusOutputSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.message,
    raw,
  };
}

/**
 * Intenta extraer un OptimusOutput desde un string JSON.
 * Hace JSON.parse primero; si falla, retorna error de parse.
 */
export function parseOptimusFromString(jsonString: string): OptimusParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { success: false, error: `JSON.parse failed: ${String(e)}`, raw: jsonString };
  }
  return parseOptimus(parsed);
}
