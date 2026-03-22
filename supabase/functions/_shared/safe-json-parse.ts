/**
 * [B6] Safe JSON parsing for LLM responses.
 *
 * LLMs sometimes return truncated or malformed JSON even when
 * the regex match succeeds. This utility wraps JSON.parse in
 * try/catch and returns a typed result.
 */

export function safeJsonParse<T = unknown>(
  text: string,
  pattern: 'object' | 'array' = 'object',
): { ok: true; data: T } | { ok: false; error: string } {
  const regex = pattern === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(regex);

  if (!match) {
    return { ok: false, error: `No JSON ${pattern} found in response` };
  }

  try {
    const data = JSON.parse(match[0]) as T;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: `JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
