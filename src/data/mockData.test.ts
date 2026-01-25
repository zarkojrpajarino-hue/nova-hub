import { describe, it, expect } from 'vitest';
import { ROLE_CONFIG, OBV_TYPES } from './mockData';

describe('mockData', () => {
  it('exports role config object', () => {
    expect(ROLE_CONFIG).toBeDefined();
    expect(typeof ROLE_CONFIG).toBe('object');
  });

  it('has sales role config', () => {
    expect(ROLE_CONFIG).toHaveProperty('sales');
    expect(ROLE_CONFIG.sales).toHaveProperty('label');
    expect(ROLE_CONFIG.sales).toHaveProperty('color');
    expect(ROLE_CONFIG.sales).toHaveProperty('icon');
  });

  it('has finance role config', () => {
    expect(ROLE_CONFIG).toHaveProperty('finance');
    expect(ROLE_CONFIG.finance).toHaveProperty('label');
  });

  it('exports obv types', () => {
    expect(OBV_TYPES).toBeDefined();
    expect(Array.isArray(OBV_TYPES)).toBe(true);
    expect(OBV_TYPES.length).toBeGreaterThan(0);
  });

  it('obv types have required structure', () => {
    const type = OBV_TYPES[0];
    expect(type).toHaveProperty('value');
    expect(type).toHaveProperty('label');
  });
});
