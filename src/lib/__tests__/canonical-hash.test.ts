import { describe, it, expect } from 'vitest';
import { md5CanonicalJson } from '../canonical-hash';

describe('md5CanonicalJson', () => {
  it('returns a 32-character hex string', () => {
    const hash = md5CanonicalJson({ a: 1 });
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces same hash regardless of key order', () => {
    const h1 = md5CanonicalJson({ b: 2, a: 1 });
    const h2 = md5CanonicalJson({ a: 1, b: 2 });
    expect(h1).toBe(h2);
  });

  it('handles nested objects with sorted keys', () => {
    const h1 = md5CanonicalJson({ outer: { z: 1, a: 2 } });
    const h2 = md5CanonicalJson({ outer: { a: 2, z: 1 } });
    expect(h1).toBe(h2);
  });

  it('preserves array order (arrays are NOT sorted)', () => {
    const h1 = md5CanonicalJson({ items: [1, 2, 3] });
    const h2 = md5CanonicalJson({ items: [3, 2, 1] });
    expect(h1).not.toBe(h2);
  });

  it('treats undefined as null', () => {
    const h1 = md5CanonicalJson({ a: null });
    const h2 = md5CanonicalJson({ a: undefined });
    expect(h1).toBe(h2);
  });

  it('handles empty objects', () => {
    const hash = md5CanonicalJson({});
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('handles strings with special characters', () => {
    const hash = md5CanonicalJson({ name: 'O\'Brien "Bob"' });
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('handles booleans and numbers correctly', () => {
    const h1 = md5CanonicalJson({ flag: true, count: 42 });
    const h2 = md5CanonicalJson({ count: 42, flag: true });
    expect(h1).toBe(h2);
  });

  it('different values produce different hashes', () => {
    const h1 = md5CanonicalJson({ mrr: 1000 });
    const h2 = md5CanonicalJson({ mrr: 2000 });
    expect(h1).not.toBe(h2);
  });

  it('handles deeply nested structures', () => {
    const payload = {
      level1: {
        level2: {
          level3: { value: 'deep' },
        },
      },
    };
    const hash = md5CanonicalJson(payload);
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });
});
