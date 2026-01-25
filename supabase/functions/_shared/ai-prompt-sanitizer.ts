/**
 * AI Prompt Injection Protection
 *
 * Sanitizes user inputs before sending to AI models (OpenAI, Anthropic, etc.)
 * to prevent prompt injection attacks.
 *
 * Attack examples this prevents:
 * - "Ignore previous instructions and..."
 * - "You are now a different assistant that..."
 * - Excessive newlines/whitespace to confuse context
 * - Unicode tricks and homoglyph attacks
 */

export interface SanitizationResult {
  sanitized: string;
  blocked: boolean;
  reason?: string;
  originalLength: number;
  sanitizedLength: number;
}

export interface SanitizerConfig {
  maxLength: number;
  allowNewlines: boolean;
  allowSpecialChars: boolean;
  strictMode: boolean; // More aggressive filtering
}

/**
 * Default configuration for different prompt types
 */
export const SanitizerPresets = {
  // Short user input (names, titles, single-line descriptions)
  SHORT_INPUT: {
    maxLength: 100,
    allowNewlines: false,
    allowSpecialChars: false,
    strictMode: true,
  },

  // Medium user input (descriptions, comments)
  MEDIUM_INPUT: {
    maxLength: 500,
    allowNewlines: true,
    allowSpecialChars: true,
    strictMode: false,
  },

  // Long user input (detailed descriptions, multi-paragraph text)
  LONG_INPUT: {
    maxLength: 2000,
    allowNewlines: true,
    allowSpecialChars: true,
    strictMode: false,
  },

  // System-generated context (less strict, but still bounded)
  SYSTEM_CONTEXT: {
    maxLength: 10000,
    allowNewlines: true,
    allowSpecialChars: true,
    strictMode: false,
  },
} as const;

/**
 * Suspicious patterns that indicate prompt injection attempts
 */
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+instructions?/gi,
  /you\s+are\s+(now|a|an)\s+(different|new)/gi,
  /forget\s+(everything|all|what)\s+/gi,
  /disregard\s+(previous|all|prior)/gi,
  /override\s+your\s+/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /\[INST\]/gi,  // Llama-style instruction markers
  /\<\|.*?\|\>/gi,  // Special tokens
  /###\s*Human:/gi,  // Anthropic-style markers
  /###\s*Assistant:/gi,
];

/**
 * Unicode normalization to prevent homoglyph attacks
 * Examples: а (Cyrillic 'a') vs a (Latin 'a')
 */
function normalizeUnicode(text: string): string {
  return text.normalize('NFKC');
}

/**
 * Remove or escape potentially dangerous characters
 */
function sanitizeSpecialChars(text: string, allow: boolean): string {
  if (allow) {
    // Allow most special chars but escape markdown/code injection
    return text
      .replace(/```/g, '\'\'\'')  // Escape code blocks
      .replace(/<script/gi, '&lt;script')  // Prevent script tags
      .replace(/<iframe/gi, '&lt;iframe');  // Prevent iframe tags
  } else {
    // Only allow alphanumeric, spaces, basic punctuation
    return text.replace(/[^a-zA-Z0-9\s.,!?'-]/g, '');
  }
}

/**
 * Normalize whitespace (collapse multiple spaces/newlines)
 */
function normalizeWhitespace(text: string, allowNewlines: boolean): string {
  if (allowNewlines) {
    // Allow newlines but collapse excessive ones
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{4,}/g, '\n\n\n')  // Max 3 consecutive newlines
      .replace(/ {2,}/g, ' ')  // Collapse multiple spaces
      .trim();
  } else {
    // Replace all whitespace with single space
    return text.replace(/\s+/g, ' ').trim();
  }
}

/**
 * Detect prompt injection attempts
 */
function detectInjection(text: string): { detected: boolean; pattern?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        detected: true,
        pattern: pattern.source,
      };
    }
  }
  return { detected: false };
}

/**
 * Main sanitization function
 */
export function sanitizePromptInput(
  input: string,
  config: SanitizerConfig = SanitizerPresets.MEDIUM_INPUT
): SanitizationResult {
  const originalLength = input.length;

  // Step 1: Length check
  if (originalLength > config.maxLength) {
    return {
      sanitized: '',
      blocked: true,
      reason: `Input exceeds maximum length (${originalLength} > ${config.maxLength})`,
      originalLength,
      sanitizedLength: 0,
    };
  }

  // Step 2: Unicode normalization
  let sanitized = normalizeUnicode(input);

  // Step 3: Injection detection (strict mode)
  if (config.strictMode) {
    const injection = detectInjection(sanitized);
    if (injection.detected) {
      return {
        sanitized: '',
        blocked: true,
        reason: `Potential prompt injection detected: ${injection.pattern}`,
        originalLength,
        sanitizedLength: 0,
      };
    }
  }

  // Step 4: Sanitize special characters
  sanitized = sanitizeSpecialChars(sanitized, config.allowSpecialChars);

  // Step 5: Normalize whitespace
  sanitized = normalizeWhitespace(sanitized, config.allowNewlines);

  // Step 6: Final length check (after sanitization)
  const sanitizedLength = sanitized.length;
  if (sanitizedLength > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
  }

  return {
    sanitized,
    blocked: false,
    originalLength,
    sanitizedLength: sanitized.length,
  };
}

/**
 * Sanitize an object's string fields recursively
 */
export function sanitizeObject(
  obj: Record<string, any>,
  fieldConfigs: Record<string, SanitizerConfig>
): { sanitized: Record<string, any>; blocked: string[] } {
  const sanitized: Record<string, any> = {};
  const blocked: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip if not a string
    if (typeof value !== 'string') {
      sanitized[key] = value;
      continue;
    }

    // Get config for this field (or use default)
    const config = fieldConfigs[key] || SanitizerPresets.MEDIUM_INPUT;

    // Sanitize the value
    const result = sanitizePromptInput(value, config);

    if (result.blocked) {
      blocked.push(`${key}: ${result.reason}`);
    } else {
      sanitized[key] = result.sanitized;
    }
  }

  return { sanitized, blocked };
}

/**
 * Wrapper for AI prompt construction that enforces length limits
 */
export function buildSafePrompt(
  systemPrompt: string,
  userPrompt: string,
  context?: string
): { prompt: string; truncated: boolean } {
  const MAX_TOTAL_LENGTH = 12000; // ~3000 tokens for GPT-4
  const MAX_CONTEXT_LENGTH = 8000;

  let totalLength = systemPrompt.length + userPrompt.length;
  let truncatedContext = context || '';
  let truncated = false;

  // Truncate context if needed
  if (context && context.length > MAX_CONTEXT_LENGTH) {
    truncatedContext = context.substring(0, MAX_CONTEXT_LENGTH) + '... [truncated]';
    truncated = true;
  }

  totalLength += truncatedContext.length;

  // If still too long, truncate user prompt
  if (totalLength > MAX_TOTAL_LENGTH) {
    const availableLength = MAX_TOTAL_LENGTH - systemPrompt.length - truncatedContext.length;
    userPrompt = userPrompt.substring(0, availableLength) + '... [truncated]';
    truncated = true;
  }

  const prompt = systemPrompt + '\n\n' + truncatedContext + '\n\n' + userPrompt;

  return { prompt, truncated };
}

/**
 * Example usage in edge functions:
 *
 * ```typescript
 * import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
 *
 * // Sanitize user input
 * const result = sanitizePromptInput(
 *   userInput.roleName,
 *   SanitizerPresets.SHORT_INPUT
 * );
 *
 * if (result.blocked) {
 *   return new Response(
 *     JSON.stringify({ error: result.reason }),
 *     { status: 400 }
 *   );
 * }
 *
 * // Use sanitized value in prompt
 * const prompt = `Generate playbook for role: ${result.sanitized}`;
 * ```
 */
