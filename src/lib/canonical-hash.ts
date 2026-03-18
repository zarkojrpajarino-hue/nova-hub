/**
 * canonical-hash.ts
 *
 * Genera el payload_hash requerido por write_integration_to_engine_table().
 *
 * Regla: payload_hash = MD5(canonical_json(payload))
 * canonical_json: ordena claves de todos los objetos recursivamente,
 * preserva el orden de arrays, elimina espacios.
 *
 * El hash SIEMPRE se calcula en TypeScript antes del RPC.
 * NUNCA se recalcula en SQL — así hay una sola implementación.
 */

import { createHash } from 'crypto';

/**
 * Serializa un valor a JSON canónico:
 * - Claves de objetos ordenadas alfabéticamente (recursivo en todos los niveles)
 * - Arrays en orden original
 * - Sin espacios ni saltos de línea
 */
function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'null'; // undefined → null en JSON
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    // Eliminar ceros insignificantes al final en decimales
    return String(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (typeof value === 'object') {
    const sorted = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => {
        const v = (value as Record<string, unknown>)[k];
        return `${JSON.stringify(k)}:${canonicalJson(v)}`;
      })
      .join(',');
    return '{' + sorted + '}';
  }
  // Fallback (bigint, symbol, function) — no esperado en payloads de integración
  return JSON.stringify(value);
}

/**
 * Calcula MD5(canonical_json(payload)).
 * Devuelve hex string de 32 caracteres.
 */
export function md5CanonicalJson(payload: Record<string, unknown>): string {
  const canonical = canonicalJson(payload);
  return createHash('md5').update(canonical, 'utf8').digest('hex');
}
