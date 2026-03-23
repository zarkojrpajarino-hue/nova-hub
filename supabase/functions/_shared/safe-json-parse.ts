/**
 * [B6] Safe JSON parsing for LLM responses.
 *
 * LLMs sometimes return truncated or malformed JSON even when
 * the regex match succeeds. This utility wraps JSON.parse in
 * try/catch and returns a typed result.
 *
 * Also handles markdown code blocks (```json ... ```) that LLMs
 * often wrap their responses in.
 */

export function safeJsonParse<T = unknown>(
  text: string,
  pattern: 'object' | 'array' = 'object',
): { ok: true; data: T } | { ok: false; error: string } {
  // First try to extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlockMatch ? codeBlockMatch[1].trim() : text;

  const regex = pattern === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = toParse.match(regex);

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

/**
 * Convenience wrapper: returns fallback on parse failure.
 */
export function safeJsonParseWithFallback<T>(text: string, fallback: T, pattern: 'object' | 'array' = 'object'): T {
  const result = safeJsonParse<T>(text, pattern);
  return result.ok ? result.data : fallback;
}
