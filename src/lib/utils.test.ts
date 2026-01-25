import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });

    it('handles conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toContain('foo');
      expect(result).toContain('baz');
      expect(result).not.toContain('bar');
    });

    it('merges tailwind conflicting classes', () => {
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2');
    });

    it('handles undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
