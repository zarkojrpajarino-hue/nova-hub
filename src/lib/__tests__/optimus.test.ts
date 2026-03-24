import { describe, it, expect } from 'vitest';
import {
  parseOptimus,
  parseOptimusFromString,
  OptimusOutputSchema,
  type OptimusOutput,
  type OptimusParseResult,
} from '../optimus';

const validOutput: OptimusOutput = {
  primary: {
    action: 'Do X',
    reason: 'Because Y',
    signal_basis: 'Signal Z',
    invalidation_condition: 'If W',
    confidence: 'high',
  },
  alternative: {
    action: 'Do A',
    reason: 'Because B',
    confidence: 'medium',
  },
};

describe('parseOptimus', () => {
  it('parses valid output successfully', () => {
    const result = parseOptimus(validOutput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primary.action).toBe('Do X');
      expect(result.data.alternative?.confidence).toBe('medium');
    }
  });

  it('accepts null alternative', () => {
    const result = parseOptimus({ ...validOutput, alternative: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alternative).toBeNull();
    }
  });

  it('rejects missing primary', () => {
    const result = parseOptimus({ alternative: null });
    expect(result.success).toBe(false);
  });

  it('rejects empty action string', () => {
    const result = parseOptimus({
      primary: { ...validOutput.primary, action: '' },
      alternative: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid confidence level', () => {
    const result = parseOptimus({
      primary: { ...validOutput.primary, confidence: 'unknown' },
      alternative: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = parseOptimus('not an object');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.raw).toBe('not an object');
    }
  });

  it('rejects null input', () => {
    const result = parseOptimus(null);
    expect(result.success).toBe(false);
  });

  it('rejects number input', () => {
    const result = parseOptimus(42);
    expect(result.success).toBe(false);
  });

  it('returns error message on failure', () => {
    const result = parseOptimus({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  it('validates all confidence levels', () => {
    for (const conf of ['high', 'medium', 'low'] as const) {
      const result = parseOptimus({
        primary: { ...validOutput.primary, confidence: conf },
        alternative: null,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('parseOptimusFromString', () => {
  it('parses valid JSON string', () => {
    const result = parseOptimusFromString(JSON.stringify(validOutput));
    expect(result.success).toBe(true);
  });

  it('returns error for invalid JSON', () => {
    const result = parseOptimusFromString('not json {{{');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('JSON.parse failed');
      expect(result.raw).toBe('not json {{{');
    }
  });

  it('returns error for valid JSON with invalid schema', () => {
    const result = parseOptimusFromString(JSON.stringify({ foo: 'bar' }));
    expect(result.success).toBe(false);
  });

  it('handles empty string', () => {
    const result = parseOptimusFromString('');
    expect(result.success).toBe(false);
  });
});

describe('OptimusOutputSchema', () => {
  it('schema is a Zod object', () => {
    expect(OptimusOutputSchema).toBeDefined();
    expect(OptimusOutputSchema.safeParse).toBeTypeOf('function');
  });
});
